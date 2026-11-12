import AdminShell from '../../components/admin/AdminShell';

export const metadata = { title: 'Admin | Thriftpedia' };

export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}