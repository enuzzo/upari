/** Discard delayed work from an earlier import, mount or replacement. */
export class RequestGate{
 private active=false;private revision=0;
 open(){this.active=true;this.revision++;}
 begin(){return ++this.revision;}
 valid(ticket:number){return this.active&&ticket===this.revision;}
 close(){this.active=false;this.revision++;}
}
