export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      analytics: {
        Row: {
          created_at: string
          dispositivo: string | null
          evento: string
          id: string
          metadata: Json | null
          navegador: string | null
          pagina: string | null
          session_id: string | null
          sistema_operativo: string | null
        }
        Insert: {
          created_at?: string
          dispositivo?: string | null
          evento: string
          id?: string
          metadata?: Json | null
          navegador?: string | null
          pagina?: string | null
          session_id?: string | null
          sistema_operativo?: string | null
        }
        Update: {
          created_at?: string
          dispositivo?: string | null
          evento?: string
          id?: string
          metadata?: Json | null
          navegador?: string | null
          pagina?: string | null
          session_id?: string | null
          sistema_operativo?: string | null
        }
        Relationships: []
      }
      asesores: {
        Row: {
          correo: string
          created_at: string
          estado: string
          estado_op: Database["public"]["Enums"]["asesor_estado"]
          hora_fin: string
          hora_inicio: string
          id: string
          is_online: boolean
          max_capacidad: number
          nombre: string
          pausa_fin: string | null
          pausa_inicio: string | null
          sede_id: string | null
          tiempo_promedio_min: number
          user_id: string | null
        }
        Insert: {
          correo: string
          created_at?: string
          estado?: string
          estado_op?: Database["public"]["Enums"]["asesor_estado"]
          hora_fin?: string
          hora_inicio?: string
          id?: string
          is_online?: boolean
          max_capacidad?: number
          nombre: string
          pausa_fin?: string | null
          pausa_inicio?: string | null
          sede_id?: string | null
          tiempo_promedio_min?: number
          user_id?: string | null
        }
        Update: {
          correo?: string
          created_at?: string
          estado?: string
          estado_op?: Database["public"]["Enums"]["asesor_estado"]
          hora_fin?: string
          hora_inicio?: string
          id?: string
          is_online?: boolean
          max_capacidad?: number
          nombre?: string
          pausa_fin?: string | null
          pausa_inicio?: string | null
          sede_id?: string | null
          tiempo_promedio_min?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asesores_sede_id_fkey"
            columns: ["sede_id"]
            isOneToOne: false
            referencedRelation: "sedes"
            referencedColumns: ["id"]
          },
        ]
      }
      encuestas_satisfaccion: {
        Row: {
          asesor_id: string | null
          atencion_score: number | null
          comentario: string | null
          created_at: string
          id: string
          proceso_financiero_score: number | null
          rating: number
          recomendaria_score: number | null
          resolvio_dudas: boolean | null
          sede_id: string | null
          tiempo_espera_score: number | null
          turno_id: string
        }
        Insert: {
          asesor_id?: string | null
          atencion_score?: number | null
          comentario?: string | null
          created_at?: string
          id?: string
          proceso_financiero_score?: number | null
          rating: number
          recomendaria_score?: number | null
          resolvio_dudas?: boolean | null
          sede_id?: string | null
          tiempo_espera_score?: number | null
          turno_id: string
        }
        Update: {
          asesor_id?: string | null
          atencion_score?: number | null
          comentario?: string | null
          created_at?: string
          id?: string
          proceso_financiero_score?: number | null
          rating?: number
          recomendaria_score?: number | null
          resolvio_dudas?: boolean | null
          sede_id?: string | null
          tiempo_espera_score?: number | null
          turno_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "encuestas_satisfaccion_asesor_id_fkey"
            columns: ["asesor_id"]
            isOneToOne: false
            referencedRelation: "asesores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encuestas_satisfaccion_sede_id_fkey"
            columns: ["sede_id"]
            isOneToOne: false
            referencedRelation: "sedes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encuestas_satisfaccion_turno_id_fkey"
            columns: ["turno_id"]
            isOneToOne: true
            referencedRelation: "turnos"
            referencedColumns: ["id"]
          },
        ]
      }
      financiaciones: {
        Row: {
          created_at: string
          cuotas: number | null
          estado: Database["public"]["Enums"]["financiacion_estado"]
          firma_fecha: string | null
          firmado: boolean
          id: string
          monto_solicitado: number | null
          observaciones: string | null
          turno_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cuotas?: number | null
          estado?: Database["public"]["Enums"]["financiacion_estado"]
          firma_fecha?: string | null
          firmado?: boolean
          id?: string
          monto_solicitado?: number | null
          observaciones?: string | null
          turno_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cuotas?: number | null
          estado?: Database["public"]["Enums"]["financiacion_estado"]
          firma_fecha?: string | null
          firmado?: boolean
          id?: string
          monto_solicitado?: number | null
          observaciones?: string | null
          turno_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sedes: {
        Row: {
          activa: boolean
          codigo: string
          created_at: string
          id: string
          nombre: string
        }
        Insert: {
          activa?: boolean
          codigo: string
          created_at?: string
          id?: string
          nombre: string
        }
        Update: {
          activa?: boolean
          codigo?: string
          created_at?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      turno_diario_counters: {
        Row: {
          created_at: string
          fecha: string
          ultimo_numero: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          fecha: string
          ultimo_numero?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          fecha?: string
          ultimo_numero?: number
          updated_at?: string
        }
        Relationships: []
      }
      turnos: {
        Row: {
          asesor_id: string | null
          atencion_fin: string | null
          atencion_inicio: string | null
          carrera: string | null
          correo: string | null
          created_at: string
          estado: string
          id: string
          nombre: string
          numero: number
          observaciones: string | null
          pausado_at: string | null
          prioridad: string
          sede_id: string | null
          semestre: number | null
          simulacion_valor: number | null
          telefono: string
          tiempo_espera: number | null
          tipificacion: string
          turno_fecha: string
          updated_at: string
        }
        Insert: {
          asesor_id?: string | null
          atencion_fin?: string | null
          atencion_inicio?: string | null
          carrera?: string | null
          correo?: string | null
          created_at?: string
          estado?: string
          id?: string
          nombre: string
          numero?: number
          observaciones?: string | null
          pausado_at?: string | null
          prioridad?: string
          sede_id?: string | null
          semestre?: number | null
          simulacion_valor?: number | null
          telefono: string
          tiempo_espera?: number | null
          tipificacion: string
          turno_fecha: string
          updated_at?: string
        }
        Update: {
          asesor_id?: string | null
          atencion_fin?: string | null
          atencion_inicio?: string | null
          carrera?: string | null
          correo?: string | null
          created_at?: string
          estado?: string
          id?: string
          nombre?: string
          numero?: number
          observaciones?: string | null
          pausado_at?: string | null
          prioridad?: string
          sede_id?: string | null
          semestre?: number | null
          simulacion_valor?: number | null
          telefono?: string
          tiempo_espera?: number | null
          tipificacion?: string
          turno_fecha?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "turnos_asesor_id_fkey"
            columns: ["asesor_id"]
            isOneToOne: false
            referencedRelation: "asesores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turnos_sede_id_fkey"
            columns: ["sede_id"]
            isOneToOne: false
            referencedRelation: "sedes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_asesoras_resumen: { Args: never; Returns: Json }
      admin_kpis_globales: { Args: never; Returns: Json }
      admin_satisfaccion_resumen: { Args: never; Returns: Json }
      admin_sedes_resumen: { Args: never; Returns: Json }
      admin_set_sede_asesora: {
        Args: { p_asesor_id: string; p_sede_id: string }
        Returns: undefined
      }
      admin_usuarios_resumen: { Args: never; Returns: Json }
      assign_advisor:
        | { Args: never; Returns: string }
        | { Args: { p_sede_id?: string }; Returns: string }
      call_next_turno: { Args: never; Returns: string }
      finish_atencion: {
        Args: { p_observaciones?: string; p_turno_id: string }
        Returns: undefined
      }
      get_turno_publico: {
        Args: { p_id: string }
        Returns: {
          asesor_id: string
          asesor_nombre: string
          atencion_fin: string
          atencion_inicio: string
          estado: string
          id: string
          numero: number
          personas_delante: number
          tiempo_estimado_min: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_asesora: { Args: never; Returns: boolean }
      is_my_turno: { Args: { _turno_id: string }; Returns: boolean }
      reassign_pending: { Args: { p_asesor_id: string }; Returns: number }
      request_turno:
        | {
            Args: {
              p_correo: string
              p_nombre: string
              p_simulacion_valor?: number
              p_telefono: string
              p_tipificacion: string
            }
            Returns: {
              id: string
              numero: number
            }[]
          }
        | {
            Args: {
              p_carrera?: string
              p_correo: string
              p_nombre: string
              p_semestre?: number
              p_simulacion_valor?: number
              p_telefono: string
              p_tipificacion: string
            }
            Returns: {
              asesor_id: string
              asesor_nombre: string
              id: string
              numero: number
              personas_delante: number
              tiempo_estimado_min: number
            }[]
          }
        | {
            Args: {
              p_carrera?: string
              p_correo: string
              p_nombre: string
              p_sede_id?: string
              p_semestre?: number
              p_simulacion_valor?: number
              p_telefono: string
              p_tipificacion: string
            }
            Returns: {
              asesor_id: string
              asesor_nombre: string
              id: string
              numero: number
              personas_delante: number
              tiempo_estimado_min: number
            }[]
          }
      set_asesor_estado: {
        Args: { p_estado: Database["public"]["Enums"]["asesor_estado"] }
        Returns: undefined
      }
      start_atencion: { Args: { p_turno_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "colaborador" | "superadmin"
      asesor_estado:
        | "disponible"
        | "ocupada"
        | "en_llamada"
        | "en_pausa"
        | "almuerzo"
        | "offline"
        | "jornada_finalizada"
      financiacion_estado:
        | "pendiente"
        | "en_revision"
        | "aprobado"
        | "rechazado"
        | "req_documentos"
        | "en_firma"
        | "finalizado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "colaborador", "superadmin"],
      asesor_estado: [
        "disponible",
        "ocupada",
        "en_llamada",
        "en_pausa",
        "almuerzo",
        "offline",
        "jornada_finalizada",
      ],
      financiacion_estado: [
        "pendiente",
        "en_revision",
        "aprobado",
        "rechazado",
        "req_documentos",
        "en_firma",
        "finalizado",
      ],
    },
  },
} as const
