import { redirect } from 'next/navigation';

export default function TutoresPage() {
  redirect('/pacientes?vista=tutores');
}
