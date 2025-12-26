import { RealQuestion } from './questionsService';

export const MOCK_MASSIVE_DB: RealQuestion[] = [
    // DIREITO CONSTITUCIONAL - FGV
    {
        id: 'db_const_fgv_001',
        year: 2023,
        source: 'CONCURSO',
        discipline: 'Direito Constitucional',
        topic: 'Direitos Fundamentais',
        statement: 'João, cidadão brasileiro, inconformado com a falta de norma regulamentadora que tornasse inviável o exercício do direito social ao transporte, impetrou mandado de injunção. À luz da sistemática constitucional, o mandado de injunção:',
        options: [
            'A) é cabível, pois a falta de norma regulamentadora inviabiliza o exercício de direitos e liberdades constitucionais e das prerrogativas inerentes à nacionalidade, à soberania e à cidadania.',
            'B) não é cabível, pois o direito ao transporte não é um direito fundamental, mas sim um direito social de segunda dimensão.',
            'C) é cabível, mas os efeitos da decisão serão sempre inter partes, não podendo alcançar outros cidadãos na mesma situação.',
            'D) não é cabível para suprir omissão legislativa referente a direitos sociais, restringindo-se a liberdades individuais.',
            'E) depende de prévia comprovação de recusa administrativa em editar a norma.'
        ],
        correctAnswer: 0,
        difficulty: 'Difícil',
        explanation: 'O Mandado de Injunção é o remédio constitucional cabível sempre que a falta de norma regulamentadora torne inviável o exercício dos direitos e liberdades constitucionais e das prerrogativas inerentes à nacionalidade, à soberania e à cidadania (CF, art. 5º, LXXI).',
        bank: 'FGV',
        role: 'Auditor Fiscal'
    },
    {
        id: 'db_const_fgv_002',
        year: 2023,
        source: 'CONCURSO',
        discipline: 'Direito Constitucional',
        topic: 'Organização do Estado',
        statement: 'A União, no exercício de sua competência privativa, editou lei estabelecendo normas gerais sobre licitações e contratos. O Estado Alfa, por sua vez, editou lei específica sobre o mesmo tema, adequando as normas gerais às suas peculiaridades locais. Diante desse cenário:',
        options: [
            'A) A lei estadual é inconstitucional, pois a competência para legislar sobre licitações é exclusiva da União.',
            'B) A lei estadual é válida, pois a União tem competência para normas gerais e os Estados para normas específicas (suplementar).',
            'C) A competência é concorrente, mas a lei estadual suspende a eficácia da lei federal no que lhe for contrário.',
            'D) Ambas as leis são inconstitucionais, pois a competência é municipal.',
            'E) A lei federal prevalece sobre a estadual em qualquer hipótese.'
        ],
        correctAnswer: 1,
        difficulty: 'Médio',
        explanation: 'Compete privativamente à União legislar sobre normas gerais de licitação e contratação (art. 22, XXVII). Isso não exclui a competência suplementar dos Estados para adequar a matéria às suas especificidades.',
        bank: 'FGV',
        role: 'Analista Judiciário'
    },

    // DIREITO ADMINISTRATIVO - CEBRASPE
    {
        id: 'db_adm_cebraspe_001',
        year: 2024,
        source: 'CONCURSO',
        discipline: 'Direito Administrativo',
        topic: 'Atos Administrativos',
        statement: 'Acerca dos atributos do ato administrativo, julgue o item a seguir: A imperatividade é o atributo pelo qual os atos administrativos se impõem a terceiros, independentemente de sua concordância.',
        options: [
            'C) Certo',
            'E) Errado'
        ],
        correctAnswer: 0,
        difficulty: 'Fácil',
        explanation: 'Correto. A imperatividade (ou coatividade) permite que a administração imponha obrigações aos administrados unilateralmente.',
        bank: 'CEBRASPE',
        role: 'Técnico Administrativo'
    },
    {
        id: 'db_adm_cebraspe_002',
        year: 2024,
        source: 'CONCURSO',
        discipline: 'Direito Administrativo',
        topic: 'Responsabilidade Civil do Estado',
        statement: 'A responsabilidade civil das pessoas jurídicas de direito privado prestadoras de serviço público é objetiva em relação a terceiros usuários e não usuários do serviço, segundo o entendimento atual do STF.',
        options: [
            'C) Certo',
            'E) Errado'
        ],
        correctAnswer: 0,
        difficulty: 'Difícil',
        explanation: 'Correto. O STF fixou a tese de que a responsabilidade civil objetiva (Teoria do Risco Administrativo) se aplica às concessionárias de serviço público em relação a terceiros, sejam eles usuários ou não do serviço (RE 591.874).',
        bank: 'CEBRASPE',
        role: 'Defensor Público'
    },

    // PORTUGUÊS - FCC
    {
        id: 'db_port_fcc_001',
        year: 2022,
        source: 'CONCURSO',
        discipline: 'Português',
        topic: 'Crase',
        statement: 'Assinale a alternativa em que o sinal indicativo de crase foi empregado de acordo com a norma-padrão.',
        options: [
            'A) O autor dedicou o livro à todas as pessoas que o ajudaram.',
            'B) Fomos à uma festa ontem à noite.',
            'C) Refiro-me àquilo que discutimos na reunião.',
            'D) Ela começou à chorar sem motivo aparente.',
            'E) O documento foi enviado à Vossa Senhoria.'
        ],
        correctAnswer: 2,
        difficulty: 'Médio',
        explanation: 'A) "todas" é pronome indefinido (não crase). B) "uma" é artigo indefinido (não crase). C) Correto, fusão de a (preposição) + aquilo. D) "chorar" é verbo (não crase). E) "Vossa Senhoria" é pronome de tratamento (não crase).',
        bank: 'FCC',
        role: 'Técnico Judiciário'
    },

    // RLM - FGV
    {
        id: 'db_rlm_fgv_001',
        year: 2023,
        source: 'CONCURSO',
        discipline: 'Raciocínio Lógico',
        topic: 'Lógica Proposicional',
        statement: 'Considere a afirmação: "Se chove, então a rua molha". A negação lógica dessa afirmação é:',
        options: [
            'A) Se não chove, então a rua não molha.',
            'B) Chove e a rua não molha.',
            'C) Não chove e a rua molha.',
            'D) Se a rua molha, então chove.',
            'E) Chove ou a rua não molha.'
        ],
        correctAnswer: 1,
        difficulty: 'Médio',
        explanation: 'A negação de uma condicional (Se P então Q) é dada por "P e não Q". Mantém a primeira e nega a segunda. Logo, "Chove E a rua NÃO molha".',
        bank: 'FGV',
        role: 'Analista de Controle Externo'
    },

    // DIREITO TRIBUTÁRIO - FGV
    {
        id: 'db_trib_fgv_001',
        year: 2023,
        source: 'CONCURSO',
        discipline: 'Direito Tributário',
        topic: 'Impostos',
        statement: 'O Imposto sobre a Propriedade Predial e Territorial Urbana (IPTU) tem como fato gerador a propriedade, o domínio útil ou a posse de bem imóvel por natureza ou por acessão física, como definido na lei civil, localizado na zona urbana do Município. Para fins de incidência do IPTU, entende-se como zona urbana a definida em lei municipal, observado o requisito mínimo da existência de melhoramentos indicados em lei. Dentre os melhoramentos previstos no CTN, NÃO se inclui:',
        options: [
            'A) meio-fio ou calçamento, com canalização de águas pluviais.',
            'B) abastecimento de água.',
            'C) sistema de esgotos sanitários.',
            'D) rede de iluminação pública, com ou sem posteamento para distribuição domiciliar.',
            'E) serviço de coleta de lixo e limpeza pública, realizado por autarquia municipal.'
        ],
        correctAnswer: 4,
        difficulty: 'Difícil',
        explanation: 'O Art. 32 do CTN lista os melhoramentos: I - meio-fio ou calçamento...; II - abastecimento de água; III - sistema de esgotos sanitários; IV - rede de iluminação pública...; V - escola primária ou posto de sáude a uma distância máxima de 3km. Não há menção a coleta de lixo no rol taxativo para definição de zona urbana (embora a coleta de lixo gere taxa).',
        bank: 'FGV',
        role: 'Auditor Fiscal'
    },

    // INFORMATICA - CEBRASPE
    {
        id: 'db_info_cebraspe_001',
        year: 2022,
        source: 'CONCURSO',
        discipline: 'Informática',
        topic: 'Segurança da Informação',
        statement: 'O phishing é um tipo de ataque de engenharia social em que o atacante tenta enganar a vítima para que ela revele informações confidenciais, como senhas e números de cartão de crédito, fingindo ser uma entidade confiável.',
        options: [
            'C) Certo',
            'E) Errado'
        ],
        correctAnswer: 0,
        difficulty: 'Fácil',
        explanation: 'Correto. Phishing (pescaria) é a técnica clássica de enganar o usuário via e-mail ou sites falsos para roubar credenciais.',
        bank: 'CEBRASPE',
        role: 'Agente de Polícia Federal'
    },

    // DIREITO PENAL - FGV
    {
        id: 'db_penal_fgv_001',
        year: 2023,
        source: 'CONCURSO',
        discipline: 'Direito Penal',
        topic: 'Teoria do Crime',
        statement: 'Caio, com intenção de matar, dispara arma de fogo contra Tício. Tício é atingido, mas é socorrido a tempo e sobrevive. Nesse caso, Caio responderá por:',
        options: [
            'A) Homicídio consumado, pois esgotou os atos executórios.',
            'B) Homicídio tentado.',
            'C) Lesão corporal grave.',
            'D) Lesão corporal seguida de tentativa de morte.',
            'E) Atentado violento ao pudor.'
        ],
        correctAnswer: 1,
        difficulty: 'Fácil',
        explanation: 'Se o agente inicia a execução de um crime de homicídio (animus necandi), mas o resultado morte não ocorre por circunstâncias alheias à sua vontade, configura-se a tentativa (art. 14, II, CP).',
        bank: 'FGV',
        role: 'Investigador de Polícia'
    },

    // LEGISLAÇÃO ADUANEIRA - ESAF (Classic)
    {
        id: 'db_aduan_esaf_001',
        year: 2012,
        source: 'CONCURSO',
        discipline: 'Legislação Aduaneira',
        topic: 'Regimes Aduaneiros',
        statement: 'O regime aduaneiro especial que permite a importação de mercadorias que devam permanecer no País durante prazo fixado, com suspensão total do pagamento de tributos, ou com pagamento proporcional ao tempo de permanência, denomina-se:',
        options: [
            'A) Trânsito Aduaneiro.',
            'B) Admissão Temporária.',
            'C) Drawback.',
            'D) Entreposto Aduaneiro.',
            'E) Exportação Temporária.'
        ],
        correctAnswer: 1,
        difficulty: 'Médio',
        explanation: 'Admissão Temporária é o regime que permite a entrada de bens no país por tempo determinado com suspensão total ou parcial (proporcional) de tributos.',
        bank: 'ESAF',
        role: 'Auditor Fiscal da Receita Federal'
    }
];
