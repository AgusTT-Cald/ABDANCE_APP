// SimpleButton.tsx
type SimpleButtonProps = {
  onClick?: () => void;
  type?: 'button' | 'submit';
  children: React.ReactNode;
  className?: string;
};

const SimpleButton = ({ onClick, type = "button", children, className = "" }: SimpleButtonProps) => {
  return (
    <button type={type} onClick={onClick} className={`simple-button ${className}`}>
      {children}
    </button>
  );
};

export default SimpleButton;
