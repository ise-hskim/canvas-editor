import Editor from '../../../src/editor'

describe('메뉴-날짜 선택기', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  it('LaTeX', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      cy.get('.menu-item__date').click()

      cy.get('.menu-item__date li')
        .first()
        .click()
        .then(() => {
          const data = editor.command.getValue().data.main

          expect(data[0].type).to.eq('date')
        })
    })
  })
})
