import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const PieChartComp = ({ data, dataKey = 'value', nameKey = 'name', title }) => (
  <div className="card">
    {title && <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>}
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey={dataKey} nameKey={nameKey} paddingAngle={4}>
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  </div>
);

export default PieChartComp;