import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

interface Props {
  open: boolean;
  destino: string;
  onCancel: () => void;
  onConfirm: () => void;
}

const BackConfirmDialog = ({ open, destino, onCancel, onConfirm }: Props) => {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-ciaf-blue/10 text-ciaf-blue">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-ciaf-blue">¿Deseas volver?</DialogTitle>
          <DialogDescription className="text-center">
            Te llevaremos al paso <span className="font-semibold text-foreground">{destino}</span>.
            <br />
            Tu información quedará guardada — no perderás nada de lo que ya ingresaste.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Continuar aquí
          </Button>
          <Button onClick={onConfirm} className="flex-1 bg-ciaf-blue hover:bg-ciaf-blue/90">
            Sí, volver
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BackConfirmDialog;
