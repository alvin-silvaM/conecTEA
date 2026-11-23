import { ClipboardList } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import StateMessage from '../components/StateMessage.jsx';

// Ainda não existe backend para os registros: a tela só informa que está em desenvolvimento.
export default function RegistroPage() {
  return (
    <>
      <PageHeader titulo="Registro" descricao="Os registros de acompanhamento dos alunos ficam aqui." />
      <div className="card">
        <StateMessage icon={ClipboardList} title="Funcionalidade em desenvolvimento.">
          Em breve você poderá registrar o acompanhamento dos alunos por aqui.
        </StateMessage>
      </div>
    </>
  );
}
