import toast from 'react-hot-toast';

const useToast = () => {
  const success = (msg) => toast.success(msg);
  const error = (msg) => toast.error(msg);
  const loading = (msg) => toast.loading(msg);
  const dismiss = () => toast.dismiss();
  const promise = (p, msgs) => toast.promise(p, msgs);
  return { success, error, loading, dismiss, promise };
};

export default useToast;