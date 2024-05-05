describe('toggleModal', () => {
  const viewports = [
    { width: 500, height: 600 },
    { width: 800, height: 600 },
  ];

  viewports.forEach((viewport) => {
    context(`Viewport: ${viewport.width} x ${viewport.height}`, () => {
      beforeEach(() => {
        // Set the viewport size and open the modal before each test
        cy.viewport(viewport.width, viewport.height);
        cy.visit('http://localhost:3000');
        cy.get('.item.following').click();
        cy.wait(2000); // Wait for 2000 milliseconds
      });

      it('checks if the following modal is visible', () => {
        cy.get('#userModal').should('be.visible');
        cy.wait(500); // Wait for 500 milliseconds
      });

      it('closes the following modal and opens the legend modal when another button is clicked', () => {
        cy.get('.item.legBTN').click();
        cy.wait(2000); // Wait for 2000 milliseconds
        cy.get('#userModal').should('not.be.visible');
        // Add a check here to ensure the 'legend' modal is visible
        cy.get('#legendModal').should('be.visible');
      });
    });
  });
});
