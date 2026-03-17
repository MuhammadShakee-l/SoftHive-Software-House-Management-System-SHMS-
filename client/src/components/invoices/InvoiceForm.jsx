import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Trash2, Hash, DollarSign, FileText } from 'lucide-react';
import { createInvoice } from '../../redux/slices/invoiceSlice';
import { fetchClients } from '../../redux/slices/clientSlice';
import { fetchProjects } from '../../redux/slices/projectSlice';
import { formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';

const emptyItem = { description: '', quantity: 1, unitPrice: 0, total: 0 };

const InvoiceForm = ({ onSuccess }) => {
  const dispatch = useDispatch();
  const { clients } = useSelector((s) => s.clients);
  const { projects } = useSelector((s) => s.projects);

  const [form, setForm] = useState({
    clientId: '',
    projectId: '',
    dueDate: '',
    tax: 0,
    discount: 0,
    notes: '',
  });

  const [items, setItems] = useState([{ ...emptyItem }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchClients({ limit: 100 }));
    dispatch(fetchProjects({ limit: 100 }));
  }, [dispatch]);

  const handleFormChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      const next = { ...updated[index], [field]: value };

      const qty = Number(next.quantity || 0);
      const price = Number(next.unitPrice || 0);
      next.total = qty * price;

      updated[index] = next;
      return updated;
    });
  };

  const addItem = () => setItems((prev) => [...prev, { ...emptyItem }]);

  const removeItem = (index) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + (Number(i.total) || 0), 0),
    [items]
  );

  const total = useMemo(() => {
    const tax = Number(form.tax || 0);
    const discount = Number(form.discount || 0);
    return subtotal + tax - discount;
  }, [subtotal, form.tax, form.discount]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (items.length === 0) return toast.error('Add at least one invoice item.');
    if (items.some((i) => !String(i.description || '').trim())) return toast.error('Each item must have a description.');
    if (items.some((i) => Number(i.quantity) <= 0)) return toast.error('Quantity must be at least 1.');
    if (items.some((i) => Number(i.unitPrice) < 0)) return toast.error('Unit price cannot be negative.');

    setLoading(true);
    try {
      await dispatch(
        createInvoice({
          ...form,
          items: items.map((i) => ({
            description: String(i.description).trim(),
            quantity: Number(i.quantity),
            unitPrice: Number(i.unitPrice),
            total: Number(i.total),
          })),
          tax: Number(form.tax || 0),
          discount: Number(form.discount || 0),
        })
      ).unwrap();

      onSuccess();
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = useMemo(() => {
    if (!form.clientId) return projects || [];
    return (projects || []).filter((p) => String(p.client?._id || p.client) === String(form.clientId));
  }, [projects, form.clientId]);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Client *</label>
          <select
            name="clientId"
            className="input"
            value={form.clientId}
            onChange={handleFormChange}
            required
          >
            <option value="">Select Client</option>
            {(clients || []).map((c) => (
              <option key={c._id} value={c._id}>
                {c.companyName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Project *</label>
          <select
            name="projectId"
            className="input"
            value={form.projectId}
            onChange={handleFormChange}
            required
          >
            <option value="">Select Project</option>
            {filteredProjects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
          {form.clientId && filteredProjects.length === 0 ? (
            <p className="text-xs text-gray-400 mt-1">
              No projects found for this client.
            </p>
          ) : null}
        </div>

        <div>
          <label className="label">Due Date *</label>
          <input
            name="dueDate"
            type="date"
            className="input"
            value={form.dueDate}
            onChange={handleFormChange}
            required
          />
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-extrabold text-gray-900 dark:text-white">Invoice Items *</p>
            <p className="text-xs text-gray-400 mt-1">Use Qty × Unit Price to calculate line totals.</p>
          </div>
          <button
            type="button"
            onClick={addItem}
            className="btn-secondary text-sm py-2 px-3"
          >
            <Plus className="h-3.5 w-3.5" /> Add Item
          </button>
        </div>

        <div className="hidden md:grid grid-cols-12 gap-2 mb-2 text-xs font-semibold text-gray-400">
          <div className="col-span-6 flex items-center gap-2">
            <FileText className="h-3.5 w-3.5" /> Description
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <Hash className="h-3.5 w-3.5" /> Qty
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <DollarSign className="h-3.5 w-3.5" /> Unit Price
          </div>
          <div className="col-span-1 text-right">Total</div>
          <div className="col-span-1 text-right"> </div>
        </div>

        <div className="space-y-3">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start md:items-center p-3 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800"
            >
              <div className="md:col-span-6">
                <label className="label md:hidden">Description *</label>
                <input
                  className="input text-sm"
                  placeholder="e.g. Landing page UI, backend APIs, dashboard module"
                  value={item.description}
                  onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="label md:hidden">Qty *</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 md:hidden" />
                  <input
                    type="number"
                    className="input text-sm md:pl-3 pl-9"
                    placeholder="1"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="label md:hidden">Unit Price (USD) *</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 md:hidden" />
                  <input
                    type="number"
                    className="input text-sm md:pl-3 pl-9"
                    placeholder="100"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="md:col-span-1 text-sm font-extrabold text-gray-900 dark:text-gray-100 text-right pt-1 md:pt-0">
                {formatCurrency(item.total)}
              </div>

              <div className="md:col-span-1 flex justify-end">
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="label">Tax (USD)</label>
          <input
            name="tax"
            type="number"
            min="0"
            step="0.01"
            className="input"
            value={form.tax}
            onChange={handleFormChange}
            placeholder="0"
          />
        </div>

        <div>
          <label className="label">Discount (USD)</label>
          <input
            name="discount"
            type="number"
            min="0"
            step="0.01"
            className="input"
            value={form.discount}
            onChange={handleFormChange}
            placeholder="0"
          />
        </div>

        <div className="flex flex-col justify-end">
          <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl text-right border border-primary-100 dark:border-primary-800">
            <p className="text-xs text-gray-500">Subtotal: {formatCurrency(subtotal)}</p>
            <p className="text-xs text-gray-500">Tax: {formatCurrency(Number(form.tax || 0))}</p>
            <p className="text-xs text-gray-500">Discount: {formatCurrency(Number(form.discount || 0))}</p>
            <p className="text-lg font-black text-primary-700 dark:text-primary-300 mt-1">
              Total: {formatCurrency(total)}
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="label">Notes</label>
        <textarea
          name="notes"
          className="input resize-none"
          rows={3}
          placeholder="Payment terms, bank details, etc."
          value={form.notes}
          onChange={handleFormChange}
        />
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? (
            <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            'Create Invoice'
          )}
        </button>
      </div>
    </form>
  );
};

export default InvoiceForm;