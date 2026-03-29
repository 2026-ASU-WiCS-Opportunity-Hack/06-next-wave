export type Language = 'en' | 'es' | 'fr'

export const translations: Record<string, Record<Language, string>> = {
  full_name:            { en: 'Full Name',              es: 'Nombre Completo',        fr: 'Nom Complet' },
  dob:                  { en: 'Date of Birth',           es: 'Fecha de Nacimiento',    fr: 'Date de Naissance' },
  phone:                { en: 'Phone Number',            es: 'Número de Teléfono',     fr: 'Numéro de Téléphone' },
  email:                { en: 'Email',                   es: 'Correo Electrónico',     fr: 'Email' },
  gender:               { en: 'Gender',                  es: 'Género',                 fr: 'Genre' },
  language:             { en: 'Primary Language',        es: 'Idioma Principal',       fr: 'Langue Principale' },
  household_size:       { en: 'Household Size',          es: 'Tamaño del Hogar',       fr: 'Taille du Foyer' },
  dietary_restrictions: { en: 'Dietary Restrictions',   es: 'Restricciones Dietéticas', fr: 'Restrictions Alimentaires' },
  id_available:         { en: 'ID Available?',           es: '¿Tiene Identificación?', fr: 'Pièce d\'identité?' },
  current_situation:    { en: 'Current Situation',       es: 'Situación Actual',       fr: 'Situation Actuelle' },
  family_size:          { en: 'Family Size',             es: 'Tamaño de Familia',      fr: 'Taille de la Famille' },
  pets:                 { en: 'Pets',                    es: 'Mascotas',               fr: 'Animaux' },
  immediate_need:       { en: 'Immediate Need',          es: 'Necesidad Inmediata',    fr: 'Besoin Immédiat' },
  safe_location:        { en: 'Safe Location Available?', es: '¿Lugar Seguro?',        fr: 'Lieu Sûr Disponible?' },
  emergency_contact:    { en: 'Emergency Contact',       es: 'Contacto de Emergencia', fr: 'Contact d\'Urgence' },
  age:                  { en: 'Age',                     es: 'Edad',                   fr: 'Âge' },
  school:               { en: 'School',                  es: 'Escuela',                fr: 'École' },
  guardian_name:        { en: 'Guardian Name',           es: 'Nombre del Tutor',       fr: 'Nom du Tuteur' },
  guardian_phone:       { en: 'Guardian Phone',          es: 'Teléfono del Tutor',     fr: 'Téléphone du Tuteur' },
  condition:            { en: 'Medical Condition',       es: 'Condición Médica',       fr: 'Condition Médicale' },
  insurance:            { en: 'Insurance',               es: 'Seguro Médico',          fr: 'Assurance' },
  notes:                { en: 'Notes',                   es: 'Notas',                  fr: 'Notes' },
  submit:               { en: 'Register Client',         es: 'Registrar Cliente',      fr: 'Enregistrer le Client' },
  photo_intake:         { en: 'Scan Paper Form',         es: 'Escanear Formulario',    fr: 'Scanner le Formulaire' },
  uploading:            { en: 'Scanning form...',        es: 'Escaneando formulario...', fr: 'Scan en cours...' },
}

export type DynamicField = {
  key: string
  type: 'text' | 'number' | 'select' | 'boolean' | 'textarea'
  options?: string[]
  required?: boolean
}

// Dynamic fields per service type name
export const serviceTypeFields: Record<string, DynamicField[]> = {
  'Food Assistance': [
    { key: 'household_size', type: 'number', required: true },
    { key: 'dietary_restrictions', type: 'text' },
    { key: 'id_available', type: 'boolean' },
  ],
  'Housing Referral': [
    { key: 'current_situation', type: 'text', required: true },
    { key: 'family_size', type: 'number' },
    { key: 'pets', type: 'boolean' },
  ],
  'Crisis Intervention': [
    { key: 'immediate_need', type: 'text', required: true },
    { key: 'safe_location', type: 'boolean' },
    { key: 'emergency_contact', type: 'text' },
  ],
  'Youth Mentoring': [
    { key: 'age', type: 'number', required: true },
    { key: 'school', type: 'text' },
    { key: 'guardian_name', type: 'text', required: true },
    { key: 'guardian_phone', type: 'text', required: true },
  ],
  'Medical Support': [
    { key: 'condition', type: 'text' },
    { key: 'insurance', type: 'text' },
  ],
  'Mental Health Counseling': [
    { key: 'emergency_contact', type: 'text' },
    { key: 'immediate_need', type: 'text' },
  ],
  'Employment Assistance': [
    { key: 'current_situation', type: 'text' },
    { key: 'household_size', type: 'number' },
  ],
  'Follow-up Visit': [],
}

export function t(key: string, lang: Language): string {
  return translations[key]?.[lang] ?? key.replace(/_/g, ' ')
}
// Fetch form schema from DB for a given service type id
// Falls back to static serviceTypeFields if not found in DB
export async function getFormSchema(
  serviceTypeId: string,
  serviceTypeName: string,
  supabase: any
): Promise<DynamicField[]> {
  // Check DB first
  const { data } = await supabase
    .from('form_schemas')
    .select('fields')
    .eq('service_type_id', serviceTypeId)
    .single()

  if (data?.fields && data.fields.length > 0) {
    return data.fields as DynamicField[]
  }

  // Fall back to static templates
  return serviceTypeFields[serviceTypeName] ?? []
}