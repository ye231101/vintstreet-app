export interface AttributeOption {
  id: string;
  value: string;
  is_active: boolean;
  display_order?: number;
}

export interface Attribute {
  id: string;
  name: string;
  data_type: 'string' | 'number' | 'boolean' | 'date' | 'multi-select';
  is_required: boolean;
  attribute_options?: AttributeOption[];
}
