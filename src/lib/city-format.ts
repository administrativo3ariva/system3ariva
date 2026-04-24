// Formata nomes de cidades brasileiras com acentuação correta e Title Case
// Ex: "SAO PAULO" -> "São Paulo", "BELO HORIZONTE" -> "Belo Horizonte"

const CITY_OVERRIDES: Record<string, string> = {
  'sao paulo': 'São Paulo',
  'são paulo': 'São Paulo',
  'rio de janeiro': 'Rio de Janeiro',
  'belo horizonte': 'Belo Horizonte',
  'brasilia': 'Brasília',
  'brasília': 'Brasília',
  'salvador': 'Salvador',
  'fortaleza': 'Fortaleza',
  'curitiba': 'Curitiba',
  'manaus': 'Manaus',
  'recife': 'Recife',
  'porto alegre': 'Porto Alegre',
  'goiania': 'Goiânia',
  'goiânia': 'Goiânia',
  'belem': 'Belém',
  'belém': 'Belém',
  'vitoria': 'Vitória',
  'vitória': 'Vitória',
  'florianopolis': 'Florianópolis',
  'florianópolis': 'Florianópolis',
  'sao luis': 'São Luís',
  'são luís': 'São Luís',
  'maceio': 'Maceió',
  'maceió': 'Maceió',
  'natal': 'Natal',
  'campo grande': 'Campo Grande',
  'joao pessoa': 'João Pessoa',
  'joão pessoa': 'João Pessoa',
  'teresina': 'Teresina',
  'aracaju': 'Aracaju',
  'cuiaba': 'Cuiabá',
  'cuiabá': 'Cuiabá',
  'porto velho': 'Porto Velho',
  'macapa': 'Macapá',
  'macapá': 'Macapá',
  'rio branco': 'Rio Branco',
  'boa vista': 'Boa Vista',
  'palmas': 'Palmas',
  'guarulhos': 'Guarulhos',
  'campinas': 'Campinas',
  'sao bernardo do campo': 'São Bernardo do Campo',
  'são bernardo do campo': 'São Bernardo do Campo',
  'santo andre': 'Santo André',
  'santo andré': 'Santo André',
  'osasco': 'Osasco',
  'sorocaba': 'Sorocaba',
  'ribeirao preto': 'Ribeirão Preto',
  'ribeirão preto': 'Ribeirão Preto',
  'uberlandia': 'Uberlândia',
  'uberlândia': 'Uberlândia',
  'contagem': 'Contagem',
  'juiz de fora': 'Juiz de Fora',
  'betim': 'Betim',
  'nova iguacu': 'Nova Iguaçu',
  'nova iguaçu': 'Nova Iguaçu',
  'niteroi': 'Niterói',
  'niterói': 'Niterói',
  'sao goncalo': 'São Gonçalo',
  'são gonçalo': 'São Gonçalo',
  'duque de caxias': 'Duque de Caxias',
  'sao jose dos campos': 'São José dos Campos',
  'são josé dos campos': 'São José dos Campos',
  'jundiai': 'Jundiaí',
  'jundiaí': 'Jundiaí',
  'limeira': 'Limeira',
  'piracicaba': 'Piracicaba',
  'itaquaquecetuba': 'Itaquaquecetuba',
  'londrina': 'Londrina',
  'maringa': 'Maringá',
  'maringá': 'Maringá',
  'joinville': 'Joinville',
  'blumenau': 'Blumenau',
  'caxias do sul': 'Caxias do Sul',
  'pelotas': 'Pelotas',
  'feira de santana': 'Feira de Santana',
  'aparecida de goiania': 'Aparecida de Goiânia',
  'aparecida de goiânia': 'Aparecida de Goiânia',
  'anapolis': 'Anápolis',
  'anápolis': 'Anápolis',
};

const LOWER_WORDS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'a', 'o']);

function titleCaseWord(word: string, isFirst: boolean): string {
  if (!word) return word;
  const lower = word.toLocaleLowerCase('pt-BR');
  if (!isFirst && LOWER_WORDS.has(lower)) return lower;
  return lower.charAt(0).toLocaleUpperCase('pt-BR') + lower.slice(1);
}

export function formatCityName(input: string | null | undefined): string {
  if (!input) return '';
  const trimmed = input.trim();
  if (!trimmed) return '';

  const key = trimmed.toLocaleLowerCase('pt-BR');
  if (CITY_OVERRIDES[key]) return CITY_OVERRIDES[key];

  // Remove acentos para tentar match no override
  const stripped = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (CITY_OVERRIDES[stripped]) return CITY_OVERRIDES[stripped];

  // Fallback: Title Case preservando acentos do input
  return trimmed
    .split(/\s+/)
    .map((w, idx) => titleCaseWord(w, idx === 0))
    .join(' ');
}
