import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, ExternalLink } from "lucide-react";

const SURVEY_URL = "https://forms.gle/mmiRid2Js3v8ZpmU7";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function EncuestaModal({ open, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#001550] flex items-center gap-2">
            <Heart className="w-5 h-5 text-[#0699d9]" />
            ¡Gracias por comunicarte con CIAF!
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm text-slate-600">
          <p>
            Tu opinión es muy importante para nosotros y nos ayuda a mejorar
            continuamente nuestro servicio.
          </p>
          <p>
            Te invitamos a responder una breve encuesta de satisfacción. Solo te
            tomará unos segundos.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              asChild
              className="flex-1 bg-gradient-to-r from-[#001550] to-[#0699d9] hover:from-[#013084] hover:to-[#0699d9] text-white"
            >
              <a
                href={SURVEY_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setTimeout(onClose, 300)}
              >
                Responder encuesta
                <ExternalLink className="w-4 h-4 ml-1" />
              </a>
            </Button>
            <Button variant="ghost" onClick={onClose} className="text-slate-500">
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}