import { Component,type ReactNode } from 'react';
export default class RenderBoundary extends Component<{children:ReactNode},{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?<div className="globe-error"><p>Il globo non è disponibile. Passaggi e impostazioni restano accessibili.</p><button onClick={()=>location.reload()}>Ricarica quando sei online</button></div>:this.props.children;}
}
