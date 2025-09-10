import Editor from '../../../src/editor'

describe('메뉴-실행취소&다시실행', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  const text = 'canvas-editor'

  it('실행취소', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      cy.get('@canvas').type(`${text}1`)

      cy.get('.menu-item__undo')
        .click()
        .then(() => {
          const data = editor.command.getValue().data.main

          expect(data[0].value).to.eq(text)
        })
    })
  })

  it('다시실행', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      cy.get('@canvas').type(`${text}1`)

      cy.get('.menu-item__undo').click()

      cy.get('.menu-item__redo')
        .click()
        .then(() => {
          const data = editor.command.getValue().data.main

          expect(data[0].value).to.eq(`${text}1`)
        })
    })
  })
})
