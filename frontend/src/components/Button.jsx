import { Link } from 'react-router-dom';

// variant: "primary" (azul cheio) | "secondary" (contorno azul)
// Com a prop `to` renderiza um <Link>; sem ela, um <button>.
export default function Button({ variant = 'primary', to, className = '', children, ...props }) {
  const classes = `btn btn--${variant} ${className}`.trim();
  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  );
}
