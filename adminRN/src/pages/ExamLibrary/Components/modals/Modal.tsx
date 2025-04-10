// src/components/modals/Modal.jsx
import { Dialog } from '@headlessui/react'

import { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const Modal = ({ isOpen, onClose, title, children, size = 'md' }: ModalProps) => {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen">
        <div className="fixed inset-0 bg-black/30" />        
        <div className={`relative bg-white rounded-lg p-6 ${sizes[size]} w-full mx-4`}>
          <Dialog.Title className="text-lg font-semibold mb-4">
            {title}
          </Dialog.Title>
          
          {children}
        </div>
      </div>
    </Dialog>
  )
}

export default Modal