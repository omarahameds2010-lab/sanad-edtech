import { PrismaClient } from '@prisma/client';

/**
 * RLS tenant isolation tests.
 *
 * These run against a REAL database only when the following env vars are set:
 *   RLS_ADMIN_URL  — privileged connection used to seed/teardown (table owner / superuser)
 *   RLS_APP_URL    — runtime connection as the `app_user` role (subject to RLS)
 *
 * When they are not set (e.g. CI without a database), the suite is skipped.
 */

const ADMIN_URL = process.env.RLS_ADMIN_URL;
const APP_URL = process.env.RLS_APP_URL;

const describeRls = ADMIN_URL && APP_URL ? describe : describe.skip;

describeRls('RLS tenant isolation (real DB)', () => {
  let admin: PrismaClient;
  let app: PrismaClient;

  const TENANT_A = 'tenant_rls_a';
  const TENANT_B = 'tenant_rls_b';

  beforeAll(async () => {
    admin = new PrismaClient({ datasources: { db: { url: ADMIN_URL } } });
    app = new PrismaClient({ datasources: { db: { url: APP_URL } } });

    // Seed two tenants + one course each using the privileged connection.
    await admin.tenant.create({ data: { id: TENANT_A, name: 'Tenant A', slug: 'tenant-a-rls' } as any });
    await admin.tenant.create({ data: { id: TENANT_B, name: 'Tenant B', slug: 'tenant-b-rls' } as any });

    await admin.course.create({
      data: { id: 'course_a', tenantId: TENANT_A, title: 'Course A', slug: 'course-a', price: 0, currency: 'EGP', status: 'PUBLISHED' } as any,
    });
    await admin.course.create({
      data: { id: 'course_b', tenantId: TENANT_B, title: 'Course B', slug: 'course-b', price: 0, currency: 'EGP', status: 'PUBLISHED' } as any,
    });
  });

  afterAll(async () => {
    if (admin) {
      await admin.course.deleteMany({ where: { tenantId: { in: [TENANT_A, TENANT_B] } } });
      await admin.tenant.deleteMany({ where: { id: { in: [TENANT_A, TENANT_B] } } });
      await admin.$disconnect();
    }
    if (app) await app.$disconnect();
  });

  it('Tenant A SELECT returns only Tenant A rows', async () => {
    const rows = await app.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SELECT set_config('app.tenant_id', $1, true)`, [TENANT_A]);
      return tx.course.findMany();
    });

    expect(rows.length).toBe(1);
    expect(rows[0].id).toBe('course_a');
  });

  it('Tenant A UPDATE cannot modify Tenant B rows', async () => {
    const updated = await app.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SELECT set_config('app.tenant_id', $1, true)`, [TENANT_A]);
      return tx.course.updateMany({ where: { id: 'course_b' }, data: { title: 'HACKED' } });
    });

    expect(updated.count).toBe(0);

    const real = await admin.course.findUnique({ where: { id: 'course_b' } });
    expect(real?.title).toBe('Course B');
  });

  it('Tenant A DELETE cannot remove Tenant B rows', async () => {
    const deleted = await app.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SELECT set_config('app.tenant_id', $1, true)`, [TENANT_A]);
      return tx.course.deleteMany({ where: { id: 'course_b' } });
    });

    expect(deleted.count).toBe(0);

    const real = await admin.course.findUnique({ where: { id: 'course_b' } });
    expect(real).not.toBeNull();
  });

  it('Tenant A cannot INSERT a row owned by Tenant B', async () => {
    await expect(
      app.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.tenant_id', $1, true)`, [TENANT_A]);
        return tx.course.create({
          data: { tenantId: TENANT_B, title: 'Injected', slug: 'injected', price: 0, currency: 'EGP', status: 'DRAFT' } as any,
        });
      }),
    ).rejects.toThrow();
  });

  it('empty tenant context exposes no rows', async () => {
    const rows = await app.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SELECT set_config('app.tenant_id', $1, true)`, ['']);
      return tx.course.findMany();
    });

    expect(rows.length).toBe(0);
  });
});
