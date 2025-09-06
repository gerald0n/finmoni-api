module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'type-enum': [
            2,
            'always',
            [
                'feat',     // Nova funcionalidade
                'fix',      // Correção de bug
                'docs',     // Documentação
                'style',    // Formatação, ponto e vírgula, etc
                'refactor', // Refatoração de código
                'test',     // Adição de testes
                'chore',    // Manutenção
                'perf',     // Melhoria de performance
                'ci',       // Mudanças de CI/CD
                'build',    // Mudanças no build
                'revert'    // Reverter commit
            ]
        ],
        'subject-max-length': [2, 'always', 72],
        'subject-case': [2, 'always', 'lower-case']
    }
};