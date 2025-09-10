import Editor from '../../../src/editor'

describe('메뉴-서식 지우기', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  const text = 'canvas-editor'
  const textLength = text.length

  it('서식 지우기', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text,
          bold: true,
          italic: true
        }
      ])

      editor.command.executeSetRange(0, textLength)

      cy.get('.menu-item__format')
        .click()
        .then(() => {
          const data = editor.command.getValue().data.main

          expect(data[0].italic).to.eq(undefined)

          expect(data[0].bold).to.eq(undefined)
        })
    })
  })
})
