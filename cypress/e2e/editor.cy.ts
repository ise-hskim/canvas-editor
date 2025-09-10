import Editor from '../../src/editor'

describe('기본 기능', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  const text = 'canvas-editor'

  it('편집 저장', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      cy.get('@canvas')
        .type(text)
        .then(() => {
          const data = editor.command.getValue().data.main

          expect(data[0].value).to.eq(text)
        })
    })
  })

  it('모드 전환', () => {
    cy.get('@canvas').click()

    cy.get('.ce-cursor').should('have.css', 'display', 'block')

    cy.get('.editor-mode').click().click()

    cy.get('.editor-mode').contains('읽기 전용')

    cy.get('@canvas').click()

    cy.get('.ce-cursor').should('have.css', 'display', 'none')
  })

  it('페이지 확대/축소', () => {
    cy.get('.page-scale-add').click()

    cy.get('.page-scale-percentage').contains('110%')

    cy.get('.page-scale-minus').click().click()

    cy.get('.page-scale-percentage').contains('90%')
  })

  it('글자 수 통계', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: 'canvas-editor 2022 에디터'
        }
      ])

      cy.get('.word-count').contains('7')
    })
  })
})
