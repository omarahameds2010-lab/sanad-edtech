-- RLS for LMS Core tables added after the initial migration.
-- The init migration did not cover assignments, assignment_submissions,
-- exam_questions, exam_attempts, resources, and videos.

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'resources',
    'assignments',
    'assignment_submissions',
    'exam_questions',
    'exam_attempts',
    'videos'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- Resources
CREATE POLICY resources_select_policy ON resources
  FOR SELECT USING (current_setting('app.tenant_id', true) = tenant_id::text);
CREATE POLICY resources_insert_policy ON resources
  FOR INSERT WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);
CREATE POLICY resources_update_policy ON resources
  FOR UPDATE USING (current_setting('app.tenant_id', true) = tenant_id::text);
CREATE POLICY resources_delete_policy ON resources
  FOR DELETE USING (current_setting('app.tenant_id', true) = tenant_id::text);

-- Assignments
CREATE POLICY assignments_select_policy ON assignments
  FOR SELECT USING (current_setting('app.tenant_id', true) = tenant_id::text);
CREATE POLICY assignments_insert_policy ON assignments
  FOR INSERT WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);
CREATE POLICY assignments_update_policy ON assignments
  FOR UPDATE USING (current_setting('app.tenant_id', true) = tenant_id::text);
CREATE POLICY assignments_delete_policy ON assignments
  FOR DELETE USING (current_setting('app.tenant_id', true) = tenant_id::text);

-- Assignment submissions
CREATE POLICY assignment_submissions_select_policy ON assignment_submissions
  FOR SELECT USING (current_setting('app.tenant_id', true) = tenant_id::text);
CREATE POLICY assignment_submissions_insert_policy ON assignment_submissions
  FOR INSERT WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);
CREATE POLICY assignment_submissions_update_policy ON assignment_submissions
  FOR UPDATE USING (current_setting('app.tenant_id', true) = tenant_id::text);
CREATE POLICY assignment_submissions_delete_policy ON assignment_submissions
  FOR DELETE USING (current_setting('app.tenant_id', true) = tenant_id::text);

-- Exam questions
CREATE POLICY exam_questions_select_policy ON exam_questions
  FOR SELECT USING (current_setting('app.tenant_id', true) = tenant_id::text);
CREATE POLICY exam_questions_insert_policy ON exam_questions
  FOR INSERT WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);
CREATE POLICY exam_questions_update_policy ON exam_questions
  FOR UPDATE USING (current_setting('app.tenant_id', true) = tenant_id::text);
CREATE POLICY exam_questions_delete_policy ON exam_questions
  FOR DELETE USING (current_setting('app.tenant_id', true) = tenant_id::text);

-- Exam attempts
CREATE POLICY exam_attempts_select_policy ON exam_attempts
  FOR SELECT USING (current_setting('app.tenant_id', true) = tenant_id::text);
CREATE POLICY exam_attempts_insert_policy ON exam_attempts
  FOR INSERT WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);
CREATE POLICY exam_attempts_update_policy ON exam_attempts
  FOR UPDATE USING (current_setting('app.tenant_id', true) = tenant_id::text);
CREATE POLICY exam_attempts_delete_policy ON exam_attempts
  FOR DELETE USING (current_setting('app.tenant_id', true) = tenant_id::text);

-- Videos
CREATE POLICY videos_select_policy ON videos
  FOR SELECT USING (current_setting('app.tenant_id', true) = tenant_id::text);
CREATE POLICY videos_insert_policy ON videos
  FOR INSERT WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);
CREATE POLICY videos_update_policy ON videos
  FOR UPDATE USING (current_setting('app.tenant_id', true) = tenant_id::text);
CREATE POLICY videos_delete_policy ON videos
  FOR DELETE USING (current_setting('app.tenant_id', true) = tenant_id::text);
