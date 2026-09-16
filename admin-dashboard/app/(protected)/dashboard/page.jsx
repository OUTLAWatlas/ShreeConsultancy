import { backendFetch } from '../../../lib/backendClient';
import PipelineClient from '../../../components/PipelineClient';

export const metadata = { title: 'Pipeline — Shree Consultancy Admin' };
export const dynamic = 'force-dynamic'; // always show current data, never cache

export default async function DashboardPage() {
  const { data } = await backendFetch('/projects');
  return <PipelineClient initialProjects={data.projects || []} />;
}