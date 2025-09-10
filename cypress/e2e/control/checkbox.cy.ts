import Editor, { ControlType, ElementType } from '../../../src/editor'

describe('컨트롤-체크박스', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  const elementType: ElementType = <ElementType>'control'
  const controlType: ControlType = <ControlType>'checkbox'

  it('체크박스', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          type: elementType,
          value: '',
          control: {
            code: '98175',
            type: controlType,
            value: null,
            valueSets: [
              {
                value: '있음',
                code: '98175'
              },
              {
                value: '없음',
                code: '98176'
              }
            ]
          }
        }
      ])

      const data = editor.command.getValue().data.main[0]

      expect(data.control!.code).to.be.eq('98175')
    })
  })
})
