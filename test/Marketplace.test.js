const { assert } = require('chai');

require('chai')
  .use(require('chai-as-promised'))
  .should();

const Marketplace = artifacts.require('./Marketplace.sol');

const applicationStatus = {
  applied: 'applied',
  approved: 'approved',
  denied: 'denied',
  purchased: 'purchased'
};

contract('Marketplace', ([deployer, seller, authority, buyer, bank]) => {
  let marketplace;

  before(async () => {
    marketplace = await Marketplace.deployed();
  });
  

  describe('deployment', async () => {
    it('deploys successfully', async () => {
      // checks that the marketplace has an address therefore has deployed
      const address = await marketplace.address;
      assert.notEqual(address, 0x0);
      assert.notEqual(address, null);
      assert.notEqual(address, undefined);
      assert.notEqual(address, '');
    });

    it('has a name', async () => {
      // check that marketplace has a name
      const name = await marketplace.name();
      assert.equal(name, 'SICI Real Estate Marketplace');
    });
  });

  describe('permitApplications', async () => {
    let result, permitCount;

    before(async () => {
      // create a test permit
      result = await marketplace.createPermit(
        '123 Street, Melbourne, Victoria',
        'design.PDF',
        'L1001',
        0,
        { from: seller }
      );
      permitCount = await marketplace.permitCount();
      console.log('permitCount',permitCount);
    });

    // prettier-ignore
    it('creates a permit application from a seller', async () => {
      // log event
      const event = result.logs[0].args;

      // check data matches
      assert.equal(event.id.toNumber(), permitCount.toNumber(), 'id is correct');
      assert.equal(event.owner, seller, 'owner is correct');
      assert.equal(event.propertyAddress, '123 Street, Melbourne, Victoria', 'property address is correct');
      assert.equal(event.document, 'design.PDF', 'document is correct');
      assert.equal(event.licenceNumber, 'L1001', 'licenceNumber is correct');
      assert.equal(event.status, 0, 'status is correct');

      // Failure - must have an address
      await marketplace.createPermit('', 'design.PDF', 'L1001', 0, { from: seller }).should.be.rejected;

      // Failure - must have a document
      await marketplace.createPermit('123 Street, Melbourne, Victoria', '', 'L1001', 0, { from: seller }).should.be.rejected;

      // Failure - must have a licence
      await marketplace.createPermit('123 Street, Melbourne, Victoria', 'design.PDF', '', 0, { from: seller }).should.be.rejected;

      // Failure - must be created with a status of Applied only
      await marketplace.createPermit('123 Street, Melbourne, Victoria', 'design.PDF', 'L1001', 2, { from: seller }).should.be.rejected;
      
      // Failure - must be created by a SELLER only
      await marketplace.createPermit('123 Street, Melbourne, Victoria', 'design.PDF', 'L1001', 0, { from: buyer }).should.be.rejected;
    });

    // prettier-ignore
    it('lists permits and confirms correct values', async () => {
      const permit = await marketplace.permits(permitCount);

      // confirm that data in permit is same as data in event
      assert.equal(permit.id.toNumber(), permitCount.toNumber(), 'id is correct');
      assert.equal(permit.owner, seller, 'owner is correct');
      assert.equal(permit.propertyAddress, '123 Street, Melbourne, Victoria', 'property address is correct');
      assert.equal(permit.document, 'design.PDF', 'document is correct');
      assert.equal(permit.licenceNumber, 'L1001', 'licenceNumber is correct');
      assert.equal(permit.status, 0, 'status is correct');
    });

    // prettier-ignore
    it('approves permit from authority', async () => {
      result = await marketplace.updatePermit(permitCount, 1, { from: authority });
      // log event
      const event = result.logs[0].args;

      assert.equal(event.id.toNumber(), permitCount.toNumber(), 'id is correct');
      assert.equal(event.authBy, authority, 'approved by authority');
      assert.equal(event.status, 1, 'Status has been changed to approved');
    });

    // prettier-ignore
    it('lists permits and confirms correct values', async () => {
      const permit = await marketplace.permits(permitCount);

      // confirm that data in permit is same as data in event
      assert.equal(permit.id.toNumber(), permitCount.toNumber(), 'id is correct');
      assert.equal(permit.status, 1, 'status is correct');
    });

    // prettier-ignore
    it('denies permit from authority', async () => {
      result = await marketplace.updatePermit(permitCount, 2, { from: authority });
      // log event
      const event = result.logs[0].args;

      assert.equal(event.id.toNumber(), permitCount.toNumber(), 'id is correct');
      assert.equal(event.authBy, authority, 'denied by authority');
      assert.equal(event.status, 2, 'Status has been changed to denied');
    });

    // prettier-ignore 
    it('fails permit update', async () => {
      // Failure - must have an ID
      await marketplace.updatePermit('', 1, { from: authority }).should.be.rejected;

      // Failure - must be an ID that exists
      await marketplace.updatePermit(10101, 1, { from: authority }).should.be.rejected;

      // Failure - must change the status
      await marketplace.updatePermit(permitCount, 0, { from: authority }).should.be.rejected;

      // Failure - must not be updated by seller
      await marketplace.updatePermit(permitCount, 1, { from: seller }).should.be.rejected;

      // Failure - must be from an auth
      await marketplace.updatePermit(permitCount, 1, { from: buyer }).should.be.rejected;

    })
  });

  describe('loanApplications', async () => {
    let result, loanCount;

    before(async () => {
      // create a test permit
      result = await marketplace.createLoanApplication(
        'John Doe',
        '123 Street, Melbourne, Victoria',
        '$100,000',
        '$350,000',
        0,
        { from: buyer }
      );
      loanCount = await marketplace.loanCount();
      console.log('loanCount',loanCount);
    });

    it('creates a loan application from a buyer', async () => {
      // log event
      const event = result.logs[0].args;

      // check data matches
      assert.equal(event.id.toNumber(), loanCount.toNumber(), 'id is correct');
      assert.equal(event.applicationPropertyAddress, '123 Street, Melbourne, Victoria', 'property address is correct');
      assert.equal(event.fullName, 'John Doe', 'Name is correct');
      assert.equal(event.annualIncome, '$100,000', 'Annual Income is right');
      assert.equal(event.loanAmount, '$350,000', 'Loan amount is correct');
      assert.equal(event.status.toNumber(), 0, 'status is correct');

      // Failure - must have an address
      await marketplace.createLoanApplication( 'John Doe', '', '$100,000', '$350,000', 0, { from: buyer }).should.be.rejected;

      // Failure - must have a name
      await marketplace.createLoanApplication( '', '123 Street, Melbourne, Victoria', '$100,000', '$350,000', 0, { from: buyer }).should.be.rejected;

      // Failure - must have a annual income
      await marketplace.createLoanApplication( 'John Doe', '123 Street, Melbourne, Victoria', '', '$350,000', 0, { from: buyer }).should.be.rejected;
      
      // Failure - must have a loan amount 
      await marketplace.createLoanApplication( 'John Doe', '123 Street, Melbourne, Victoria', '$100,000', '', 0, { from: buyer }).should.be.rejected;

      // Failure - must be created with a status of Applied only
      await marketplace.createLoanApplication( 'John Doe', '123 Street, Melbourne, Victoria', '$100,000', '$350,000', 2, { from: buyer }).should.be.rejected;
      
      // Failure - must be created by a BUYER only
      await marketplace.createLoanApplication( 'John Doe', '123 Street, Melbourne, Victoria', '$100,000', '', 0, { from: seller }).should.be.rejected;
    });

    // prettier-ignore
    it('lists loans and confirms correct values', async () => {
      const loan = await marketplace.loans(loanCount);
      assert.equal(loan.id.toNumber(), loanCount.toNumber(), 'id is correct');
      assert.equal(loan.owner, buyer, 'owner is correct');
      assert.equal(loan.applicationPropertyAddress, '123 Street, Melbourne, Victoria', 'property address is correct');
      assert.equal(loan.fullName, 'John Doe', 'Full name is correct');
      assert.equal(loan.annualIncome, '$100,000', 'Annual Income correct');
      assert.equal(loan.loanAmount, '$350,000', 'Loan Amount correct');
      assert.equal(loan.status, 0, 'status is correct');
    });
    
    // prettier-ignore
    it('approves loan application from bank', async () => {
      result = await marketplace.updateLoanApplication(loanCount, 1, { from: bank });
      // log event
      const event = result.logs[0].args;
      console.log('event', event);
      assert.equal(event.id.toNumber(), loanCount.toNumber(), 'id is correct');
      assert.equal(event.authBy, bank, 'approved by bank');
      assert.equal(event.status.toNumber(), 1, 'Status has been changed to approved');
    });

    // prettier-ignore
    it('lists loan application and confirms correct values', async () => {
      const loan = await marketplace.loans(loanCount);

      // confirm that data in permit is same as data in event
      assert.equal(loan.id.toNumber(), loanCount.toNumber(), 'id is correct');
      assert.equal(loan.status.toNumber(), 1, 'status is correct');
    });

    // prettier-ignore
    it('denies loan application from bank', async () => {
      result = await marketplace.updateLoanApplication(loanCount, 2, { from: bank });
      // log event
      const event = result.logs[0].args;

      assert.equal(event.id.toNumber(), loanCount.toNumber(), 'id is correct');
      assert.equal(event.authBy, bank, 'denied by bank');
      assert.equal(event.status, 2, 'Status has been changed to denied');
    });

    // prettier-ignore 
    it('fails loan application update', async () => {
      // Failure - must have an ID
      await marketplace.updateLoanApplication('', 1, { from: bank }).should.be.rejected;

      // Failure - must be an ID that exists
      await marketplace.updateLoanApplication(19211, 1, { from: bank }).should.be.rejected;

      // Failure - must change the status
      await marketplace.updateLoanApplication(loanCount, 0, { from: bank }).should.be.rejected;

      // Failure - must not be updated by buyer
      await marketplace.updateLoanApplication(loanCount, 1, { from: buyer }).should.be.rejected;

      // Failure - must be from an bank
      await marketplace.updateLoanApplication(loanCount, 1, { from: authority }).should.be.rejected;
    })
  });
});
