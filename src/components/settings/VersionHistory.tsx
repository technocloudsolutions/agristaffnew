import { FC } from 'react';
import { Database, RotateCcw } from 'lucide-react';
import type { VersionHistoryProps } from '@/types/version';

export const VersionHistory: FC<VersionHistoryProps> = ({ versions, onRevert }) => {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <Database className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-medium">Version History</h3>
      </div>
      <div className="space-y-4">
        {versions.length > 0 ? (
          versions.map((version, index) => (
            <div key={version.id || index} className="border-b border-border pb-4 last:border-0">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Version {version.version}</p>
                  <p className="text-xs text-muted-foreground">
                    Updated by {version.createdBy} on {version.date}
                  </p>
                </div>
                {onRevert && index > 0 && (
                  <button
                    onClick={() => onRevert(version)}
                    className="flex items-center gap-2 text-xs text-primary hover:text-primary/80"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Revert to this version
                  </button>
                )}
              </div>
              <ul className="mt-2 text-sm">
                {version.changes.map((change, idx) => (
                  <li key={idx} className="text-muted-foreground">• {change}</li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No version history available</p>
        )}
      </div>
    </div>
  );
}; 