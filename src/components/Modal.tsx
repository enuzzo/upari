import { useId,useLayoutEffect,useRef,type ReactNode } from 'react';
import { X } from 'lucide-react';
export default function Modal({title,onClose,children,className=''}:{title:string;onClose:()=>void;children:ReactNode;className?:string}) {
  const ref=useRef<HTMLDialogElement>(null),close=useRef<HTMLButtonElement>(null),titleId=useId();
  useLayoutEffect(()=>{
    const d=ref.current!,opener=document.activeElement instanceof HTMLElement?document.activeElement:null;
    d.showModal();
    return()=>{d.close();if(opener?.isConnected)opener.focus({preventScroll:true});};
  },[]);
  // Selecting a layer removes the focused picker row. Keep keyboard navigation in the new pane.
  useLayoutEffect(()=>{if(ref.current?.open&&!ref.current.contains(document.activeElement))close.current?.focus({preventScroll:true});});
  return <dialog ref={ref} className={'modal '+className} aria-labelledby={titleId} onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===ref.current)onClose();}}><header><h2 id={titleId}>{title}</h2><button ref={close} className="icon-button" aria-label="Chiudi" onClick={onClose}><X/></button></header><div className="modal-body">{children}</div></dialog>;
}
