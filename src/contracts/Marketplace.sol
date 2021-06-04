pragma solidity >0.5.0;

contract Marketplace {
  string public name;
  // string public Authority;
  // string public Seller;

  uint256 public permitCount = 0;
  mapping(uint256 => PermitApplication) public permits;

  uint256 public loanCount = 0;
  mapping(uint256 => LoanApplication) public loans;

  // TODO - create the banking side of contracts - loanApplications etc

  // mapping(address => Account) public accounts;

  // enum to control the states of applications rather than multiple booleans
  enum applicationStatus { applied, approved, denied, purchased }

  applicationStatus constant DEFAULT_VALUE = applicationStatus.applied;

  enum accountType { deployer, seller, authority, buyer, bank }

  struct Account {
    address accountAddress;
    accountType account;
  }

  // TODO find a way for this to take a document - buffer maybe?
  struct PermitApplication {
    uint256 id;
    address owner;
    string propertyAddress;
    string document;
    string licenceNumber;
    applicationStatus status;
  }

  event PermitCreated(
    uint256 id,
    address owner,
    string propertyAddress,
    string document,
    string licenceNumber,
    applicationStatus status
  );

  event PermitStatus(uint256 id, applicationStatus status, address authBy);

  // original struct - too many variables for this version of truffle
  // struct LoanApplication {
  //     uint id;
  //     address owner;
  //     string fullName;
  //     uint256 birthdate;
  //     string currentAddress;
  //     string contactNumber;
  //     string employerName;
  //     string annualIncome;
  //     string applicationProperyAddress;
  //     string loanAmount;
  //     applicationStatus status;
  // }
  struct LoanApplication {
    uint256 id;
    address owner;
    string fullName;
    string annualIncome;
    string applicationProperyAddress;
    string loanAmount;
    applicationStatus status;
  }

  event LoanCreated(
    uint256 id,
    address owner,
    string fullName,
    string annualIncome,
    string applicationPropertyAddress,
    string loanAmount,
    applicationStatus status
  );

  event LoanStatus(uint256 id, address authBy, applicationStatus status);

  constructor() public {
    name = 'SICI Real Estate Marketplace';
  }

  function createPermit(
    string memory _propertyAddress,
    string memory _document,
    string memory _licenceNumber,
    applicationStatus _status
  ) public {
    // requires strings to not be empty
    require(bytes(_propertyAddress).length > 0);
    require(bytes(_document).length > 0);
    require(bytes(_licenceNumber).length > 0);
    // status of a new application must be applied ONLY
    require(_status == applicationStatus.applied);
    // only be created by a seller TODO find better implementation of this
    require(msg.sender == 0x7e14E1b59aF858C2E366B1d902aBBB743275F694);

    permitCount++;
    permits[permitCount] = PermitApplication(
      permitCount,
      msg.sender,
      _propertyAddress,
      _document,
      _licenceNumber,
      _status
    );

    emit PermitCreated(
      permitCount,
      msg.sender,
      _propertyAddress,
      _document,
      _licenceNumber,
      _status
    );
  }

  /**
   * Changes the permits status
   * @param _id permit ID
   * @param _status status that is being applied to the permit
   */
  function updatePermit(uint256 _id, applicationStatus _status) public {
    // fetch permit
    PermitApplication memory _permit = permits[_id];
    // validate permit exists
    require(_permit.id > 0 && _permit.id <= permitCount);
    // validate that the status is not the same - NOT SURE THIS WORKS CORRECTLY
    require(_status != _permit.status);
    // validate that it is not being updated back to applied
    require(_status != applicationStatus.applied);

    // TODO find better implementation of auth checking - look into proof of authority if we can
    // seller can not update their own permit
    require(_permit.owner != msg.sender);
    // only be updated by an authority
    require(msg.sender == 0x2b0d61c05D8caFF492E1d6a6D3451437801D4b6B);

    // update permit
    _permit.status = _status;
    permits[_id] = _permit;
    // trigger event
    emit PermitStatus(_id, _permit.status, msg.sender);
  }

  function createLoanApplication(
    string memory _fullName,
    string memory _applicationProperyAddress,
    string memory _annualIncome,
    string memory _loanAmount,
    applicationStatus _status
  ) public {
    require(bytes(_applicationProperyAddress).length > 0);
    require(bytes(_fullName).length > 0);
    require(bytes(_loanAmount).length > 0);

    loanCount++;
    loans[loanCount] = LoanApplication(
      loanCount,
      msg.sender,
      _fullName,
      _annualIncome,
      _applicationProperyAddress,
      _loanAmount,
      _status
    );
    emit LoanCreated(
      loanCount,
      msg.sender,
      _fullName,
      _annualIncome,
      _applicationProperyAddress,
      _loanAmount,
      _status
    );
  }

  function updateLoanApplication(uint256 _id, applicationStatus _status)
    public
  {
    LoanApplication memory _loan = loans[_id];

    // validate permit exists
    require(_loan.id > 0 && _loan.id <= loanCount);
    // validate that the status is not the same
    require(_loan.status != _status);

    _loan.status = _status;
    emit LoanStatus(_id, msg.sender, _status);
  }
}
