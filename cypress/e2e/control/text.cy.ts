import Editor, { ControlType, ElementType } from '../../../src/editor'

describe('컨트롤-텍스트형', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  const text = `canvas-editor`
  const elementType: ElementType = <ElementType>'control'
  const controlType: ControlType = <ControlType>'text'

  it('텍스트형', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          type: elementType,
          value: '',
          control: {
            type: controlType,
            value: null,
            placeholder: '텍스트형'
          }
        }
      ])

      cy.get('@canvas').type(`{leftArrow}`)

      cy.get('.ce-inputarea')
        .type(text)
        .then(() => {
          const data = editor.command.getValue().data.main[0]

          expect(data.control!.value![0].value).to.be.eq(text)
        })
    })
  })
})
