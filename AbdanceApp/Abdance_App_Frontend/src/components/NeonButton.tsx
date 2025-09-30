import React from 'react';

interface NeonButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

const NeonButton: React.FC<NeonButtonProps> = ({ children, onClick, type = "button" }) => {
  return (
    <button onClick={onClick} className="neon-button" type={type}>
      {children}
    </button>
  );
};

export default NeonButton;
