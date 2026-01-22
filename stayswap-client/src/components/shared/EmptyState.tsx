import { ReactNode } from 'react';
import { FileQuestion, Home, MessageCircle, Bell } from 'lucide-react';

interface EmptyStateProps {
  icon?: 'file' | 'home' | 'message' | 'bell';
  title: string;
  description?: string;
  action?: ReactNode;
}

const icons = {
  file: FileQuestion,
  home: Home,
  message: MessageCircle,
  bell: Bell,
};

export function EmptyState({
  icon = 'file',
  title,
  description,
  action,
}: EmptyStateProps) {
  const Icon = icons[icon];

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Icon className="h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 mb-4">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
