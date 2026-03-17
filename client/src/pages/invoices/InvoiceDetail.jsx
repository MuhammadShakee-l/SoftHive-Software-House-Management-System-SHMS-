import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Printer } from 'lucide-react';
import { useDispatch } from 'react-redux';
import invoiceService from '../../services/invoiceService';
import { updateInvoice } from '../../redux/slices/invoiceSlice';
import Loader from '../../components/common/Loader';
import { formatDate, formatCurrency, getStatusColor } from '../../utils/helpers';
import useAuth from '../../hooks/useAuth';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAdmin } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoiceService.getInvoice(id)
      .then((res) => setInvoice(res.data.data.invoice))
      .catch(() => navigate('/invoices'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleMarkPaid = async () => {
    if (!window.confirm('Mark as paid?')) return;
    await dispatch(updateInvoice({ id, data: { status: 'paid', paymentMethod: 'bank-transfer' } }));
    setInvoice((prev) => ({ ...prev, status: 'paid' }));
  };

  if (loading) return <Loader text="Loading invoice..." />;
  if (!invoice) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/invoices')} className="btn-secondary">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex gap-2">
          {isAdmin && invoice.status !== 'paid' && (
            <button onClick={handleMarkPaid} className="btn-primary bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4" /> Mark as Paid
            </button>
          )}
          <button onClick={() => window.print()} className="btn-secondary">
            <Printer className="h-4 w-4" /> Print
          </button>
        </div>
      </div>

      {/* Invoice card */}
      <div className="card print:shadow-none" id="invoice-print">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <span className="text-white font-bold text-sm">SH</span>
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-lg">SHMS</p>
                <p className="text-xs text-gray-400">Software House Management System</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">123 Tech Street, Silicon Valley</p>
            <p className="text-sm text-gray-500">info@shms.com</p>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">INVOICE</h2>
            <p className="font-mono text-primary-600 font-bold mt-1">{invoice.invoiceId}</p>
            <span className={`badge mt-2 ${getStatusColor(invoice.status)}`}>{invoice.status}</span>
          </div>
        </div>

        {/* Bill to / Bill from */}
        <div className="grid grid-cols-2 gap-6 mb-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Bill To</p>
            <p className="font-semibold text-gray-900 dark:text-white">{invoice.client?.companyName}</p>
            <p className="text-sm text-gray-500">{invoice.client?.user?.name}</p>
            <p className="text-sm text-gray-500">{invoice.client?.user?.email}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Invoice Details</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="text-gray-400">Project: </span>{invoice.project?.name}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="text-gray-400">Issued: </span>{formatDate(invoice.createdAt)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="text-gray-400">Due: </span>{formatDate(invoice.dueDate)}
            </p>
            {invoice.paidAt && (
              <p className="text-sm text-green-600 font-medium">
                Paid: {formatDate(invoice.paidAt)}
              </p>
            )}
          </div>
        </div>

        {/* Items table */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200 dark:border-gray-600">
                <th className="text-left py-3 font-semibold text-gray-700 dark:text-gray-300">Description</th>
                <th className="text-center py-3 font-semibold text-gray-700 dark:text-gray-300">Qty</th>
                <th className="text-right py-3 font-semibold text-gray-700 dark:text-gray-300">Unit Price</th>
                <th className="text-right py-3 font-semibold text-gray-700 dark:text-gray-300">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {invoice.items.map((item, i) => (
                <tr key={i}>
                  <td className="py-3 text-gray-700 dark:text-gray-300">{item.description}</td>
                  <td className="py-3 text-center text-gray-500">{item.quantity}</td>
                  <td className="py-3 text-right text-gray-500">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-3 text-right font-medium text-gray-900 dark:text-white">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600 dark:text-gray-300">
              <span>Subtotal</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.tax > 0 && (
              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span>Tax</span>
                <span>{formatCurrency(invoice.tax)}</span>
              </div>
            )}
            {invoice.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>- {formatCurrency(invoice.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-600 pt-2">
              <span>Total</span>
              <span>{formatCurrency(invoice.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Notes</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceDetail;