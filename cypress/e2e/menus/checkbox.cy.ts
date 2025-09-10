import Editor, { ElementType } from '../../../src/editor'

describe('메뉴-체크박스', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  const type: ElementType = <ElementType>'checkbox'

  it('코드 블록', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          type,
          value: '',
          checkbox: {
            value: true
          }
        }
      ])

      const data = editor.command.getValue().data.main[0]

      expect(data.checkbox?.value).to.eq(true)
    })
  })
})
