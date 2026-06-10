
ALTER TABLE public.turnos
  ADD COLUMN IF NOT EXISTS encuesta_modal_shown_at timestamptz;

CREATE OR REPLACE FUNCTION public.mark_encuesta_modal_shown(p_turno_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_ok boolean;
  v_updated int;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'no autenticado'; END IF;
  v_ok := public.has_role(v_user, 'admin'::app_role)
       OR public.has_role(v_user, 'superadmin'::app_role)
       OR public.is_my_turno(p_turno_id);
  IF NOT v_ok THEN RAISE EXCEPTION 'no autorizado'; END IF;

  UPDATE public.turnos
    SET encuesta_modal_shown_at = now()
    WHERE id = p_turno_id
      AND encuesta_modal_shown_at IS NULL;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_encuesta_modal_shown(uuid) TO authenticated;
