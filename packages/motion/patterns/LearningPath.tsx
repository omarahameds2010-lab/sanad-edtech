import { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface LearningPathProps extends HTMLMotionProps<'div'> {
  /** Path nodes */
  nodes: Array<{
    id: string;
    label: string;
    position: { x: number; y: number };
    completed: boolean;
    current?: boolean;
    type: 'lesson' | 'assignment' | 'exam' | 'resource';
  }>;
  /** Path connections */
  connections: Array<{
    from: string;
    to: string;
    type?: 'solid' | 'dashed';
  }>;
  /** Animation duration */
  duration?: number;
  /** Show progress animation */
  animateProgress?: boolean;
}

export const LearningPath = forwardRef<HTMLDivElement, LearningPathProps>(
  ({ nodes, connections, duration = 800, animateProgress = true, children, ...props }, ref) => {
    // Calculate path for connections
    const getPath = (from: { x: number; y: number }, to: { x: number; y: number }) => {
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;
      return `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`;
    };

    return (
      <div ref={ref} style={{ position: 'relative', width: '100%', height: '100%' }}>
        {/* Connection Lines */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <path d="M 0 0 L 10 3.5 L 0 7 Z" fill="var(--color-border-main)" />
            </marker>
          </defs>
          {connections.map((conn, i) => {
            const from = nodes.find(n => n.id === conn.from);
            const to = nodes.find(n => n.id === conn.to);
            if (!from || !to) return null;
            return (
              <motion.path
                key={conn.from + '-' + conn.to}
                d={`M ${from.position.x} ${from.position.y} L ${to.position.x} ${to.position.y}`}
                stroke="var(--color-border-main)"
                strokeWidth={2}
                fill="none"
                strokeDasharray={conn.type === 'dashed' ? '5,5' : 'none'}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: 'ease-in-out' }}
                style={{ markerEnd: 'url(#arrowhead)' }}
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {nodes.map((node, i) => (
          <motion.div
            key={node.id}
            style={{
              position: 'absolute',
              left: `${node.position.x}px`,
              top: `${node.position.y}px`,
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: i * 0.1, ease: 'ease-out' }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <div
              className={`learning-path-node ${node.completed ? 'completed' : ''} ${node.current ? 'current' : ''}`}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: node.current
                  ? 'var(--color-accent)'
                  : node.completed
                  ? 'var(--color-success)'
                  : 'var(--color-surface-primary)',
                border: node.completed
                  ? '3px solid var(--color-success)'
                  : node.current
                  ? '3px solid var(--color-accent)'
                  : '2px solid var(--color-border-main)',
                boxShadow: node.current
                  ? '0 0 0 4px var(--color-accent-light)'
                  : 'none',
                cursor: 'pointer',
              }}
            >
              {node.type === 'lesson' && <span>📖</span>}
              {node.type === 'assignment' && <span>📝</span>}
              {node.type === 'exam' && <span>📝</span>}
              {node.type === 'resource' && <span>📄</span>}
              {node.completed && <span style={{ color: 'white', fontSize: '14px', fontWeight: 700 }}>✓</span>}
            </div>
            <motion.div
              layoutId={`label-${node.id}`}
              style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginTop: '8px',
                whiteSpace: 'nowrap',
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--color-text-primary)',
                background: 'var(--color-surface-primary)',
                padding: '4px 8px',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              {node.label}
            </motion.div>
          </motion.div>
        ))}
      </div>
    );
  }
);

LearningPath.displayName = 'LearningPath';

export default LearningPath;