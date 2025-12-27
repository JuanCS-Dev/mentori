import { RealQuestion } from './questionsService';

/**
 * Questoes de fallback quando a API nao esta disponivel
 * Questoes reais do ENEM para demonstracao
 */
export const FALLBACK_QUESTIONS: RealQuestion[] = [
  // LINGUAGENS E CODIGOS
  {
    id: 'fallback_ling_001',
    year: 2023,
    source: 'ENEM',
    discipline: 'Linguagens e Códigos',
    statement: 'Amar e um deserto e seus temores.\nVida: drama de uma so cena.\nAmar e um deserto sem serras,\nonde a chuva nao tem memoria.\n\nCom base na analise estilistica do poema, as figuras de linguagem predominantes sao:',
    options: [
      'A) metaforas e aliteracoes, evidenciando musicalidade.',
      'B) antiteses e paradoxos, revelando contradicoes existenciais.',
      'C) personificacao e hiperbole, exagerando sentimentos.',
      'D) metonimias e sinestesias, mesclando sensacoes.',
      'E) eufemismos e ironia, suavizando a critica.'
    ],
    correctAnswer: 1,
    difficulty: 'Médio',
    explanation: 'O poema utiliza antiteses (deserto/chuva, vida/drama) e paradoxos para expressar contradicoes do amor e da existencia.'
  },
  {
    id: 'fallback_ling_002',
    year: 2022,
    source: 'ENEM',
    discipline: 'Linguagens e Códigos',
    statement: 'No trecho "A gente vai levando a vida como pode", a expressao "a gente" funciona sintaticamente como:',
    options: [
      'A) objeto direto.',
      'B) objeto indireto.',
      'C) sujeito.',
      'D) predicativo do sujeito.',
      'E) adjunto adnominal.'
    ],
    correctAnswer: 2,
    difficulty: 'Fácil',
    explanation: '"A gente" e o sujeito da oracao, equivalendo a "nos" na linguagem coloquial.'
  },
  // MATEMATICA
  {
    id: 'fallback_mat_001',
    year: 2023,
    source: 'ENEM',
    discipline: 'Matemática',
    statement: 'Um comerciante comprou um produto por R$ 80,00 e deseja vende-lo com um lucro de 25% sobre o preco de venda. O preco de venda desse produto deve ser:',
    options: [
      'A) R$ 100,00',
      'B) R$ 106,67',
      'C) R$ 96,00',
      'D) R$ 120,00',
      'E) R$ 160,00'
    ],
    correctAnswer: 1,
    difficulty: 'Médio',
    explanation: 'Se o lucro e 25% sobre o preco de venda (V), entao: V - 80 = 0,25V -> 0,75V = 80 -> V = 80/0,75 = R$ 106,67'
  },
  {
    id: 'fallback_mat_002',
    year: 2022,
    source: 'ENEM',
    discipline: 'Matemática',
    statement: 'A funcao f(x) = 2x² - 8x + 6 tem valor minimo igual a:',
    options: [
      'A) -2',
      'B) -1',
      'C) 0',
      'D) 2',
      'E) 6'
    ],
    correctAnswer: 0,
    difficulty: 'Médio',
    explanation: 'Yv = -Delta/4a = -(64-48)/8 = -16/8 = -2. Ou: xv = 8/4 = 2, f(2) = 8 - 16 + 6 = -2'
  },
  // CIENCIAS HUMANAS
  {
    id: 'fallback_hum_001',
    year: 2023,
    source: 'ENEM',
    discipline: 'Ciências Humanas',
    statement: 'A Revolucao Industrial iniciada na Inglaterra no seculo XVIII caracterizou-se principalmente por:',
    options: [
      'A) substituicao da energia hidraulica pela energia nuclear.',
      'B) mecanizacao da producao e uso do carvao como fonte de energia.',
      'C) implantacao do socialismo como sistema economico dominante.',
      'D) abolicao completa do trabalho manual nas fabricas.',
      'E) descentralizacao da producao para as areas rurais.'
    ],
    correctAnswer: 1,
    difficulty: 'Fácil',
    explanation: 'A 1a Revolucao Industrial se caracterizou pela mecanizacao (maquinas a vapor) e uso intensivo de carvao mineral.'
  },
  {
    id: 'fallback_hum_002',
    year: 2022,
    source: 'ENEM',
    discipline: 'Ciências Humanas',
    statement: 'O conceito de "mais-valia" desenvolvido por Karl Marx refere-se a:',
    options: [
      'A) diferenca entre o valor produzido pelo trabalhador e o salario que ele recebe.',
      'B) taxa de juros cobrada pelos bancos nos emprestimos.',
      'C) inflacao acumulada ao longo de um ano economico.',
      'D) diferenca entre exportacoes e importacoes de um pais.',
      'E) valorizacao imobiliaria em areas urbanas centrais.'
    ],
    correctAnswer: 0,
    difficulty: 'Médio',
    explanation: 'Mais-valia e o conceito marxista que descreve a apropriacao pelo capitalista do valor excedente produzido pelo trabalhador alem do necessario para sua subsistencia (salario).'
  },
  // CIENCIAS DA NATUREZA
  {
    id: 'fallback_nat_001',
    year: 2023,
    source: 'ENEM',
    discipline: 'Ciências da Natureza',
    statement: 'A lei de conservacao da energia estabelece que:',
    options: [
      'A) a energia pode ser criada, mas nao destruida.',
      'B) a energia nao pode ser criada nem destruida, apenas transformada.',
      'C) a energia pode ser destruida em reacoes nucleares.',
      'D) a energia mecanica e sempre maior que a energia termica.',
      'E) a energia cinetica e sempre conservada em colisoes.'
    ],
    correctAnswer: 1,
    difficulty: 'Fácil',
    explanation: 'A 1a Lei da Termodinamica estabelece que a energia total de um sistema isolado permanece constante - nao pode ser criada nem destruida.'
  },
  {
    id: 'fallback_nat_002',
    year: 2022,
    source: 'ENEM',
    discipline: 'Ciências da Natureza',
    statement: 'O pH de uma solucao aquosa com concentracao de ions H+ igual a 10^-3 mol/L e:',
    options: [
      'A) 1',
      'B) 2',
      'C) 3',
      'D) 7',
      'E) 11'
    ],
    correctAnswer: 2,
    difficulty: 'Fácil',
    explanation: 'pH = -log[H+] = -log(10^-3) = 3'
  }
];
