export interface Partner {
  id: string;
  name: string;
  discount: string;
  category: 'Farmácia' | 'Bem-estar' | 'Ótica' | 'Alimentação' | 'Estética' | 'Outros';
  description: string;
  logoColor: string;
  telephone: string; // The specific telephone/contact number to easily copy
  website?: string;
  exclusiveMaterials?: string[]; // Optional specific template IDs for this partner
  city: string;
}

export interface SupportMaterial {
  id: string;
  title: string;
  category: 'Redes Sociais' | 'Banners' | 'Impressos';
  format: string;
  dimensions: string;
  description: string;
  accentColor: string;
  templateType: 'post_desconto' | 'banner_convenio' | 'post_informativo';
}
