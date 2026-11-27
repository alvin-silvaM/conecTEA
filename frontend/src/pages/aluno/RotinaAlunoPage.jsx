import { Calendar } from 'lucide-react';

// Rotina ainda não existe no backend: tela informativa, como no Figma ("Opção futura").
export default function RotinaAlunoPage() {
  return (
    <>
      <h1 className="aluno__titulo">Minha rotina</h1>
      <section className="rotina-vazia">
        <span className="rotina-vazia__icone">
          <Calendar size={72} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <span className="etiqueta etiqueta--futura">Opção futura</span>
        <p>Em breve você vai ver aqui o seu dia, passo a passo.</p>
      </section>
    </>
  );
}
