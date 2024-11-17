interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className={`rounded-lg shadow-lg p-4 ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
      } text-white flex items-center gap-2`}>
        <span>{message}</span>
        <button 
          onClick={onClose}
          className="ml-2 hover:opacity-80"
        >
          ×
        </button>
      </div>
    </div>
  );
} 