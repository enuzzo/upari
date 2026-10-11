import { useEffect,useRef,type ReactNode } from 'react';
import { X } from 'lucide-react';
export default function Modal({title,onClose,children,className=''}:{title:string;onClose:()=>void;children:ReactNode;className?:string}) {
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const d=ref.current!;d.showModal();return()=>{d.close();};},[]);
  return <dialog ref={ref} className={'modal '+className} onCancel={onClose} onClick={e=>{if(e.target===ref.current)onClose();}}><header><h2>{title}</h2><button className="icon-button" aria-label="Chiudi" onClick={onClose}><X/></button></header><div className="modal-body">{children}</div></dialog>;
}
