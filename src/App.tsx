import React, { Component } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Spinner, ThemeProvider } from 'react-bootstrap';
import Web3 from 'web3';
import Footer from './components/Footer';
import NavigationBar from './components/NavigationBar';
import Main from './pages/Main';
import { applicationStatus, requestType } from './utils/enums';
import LoadSpinner from './components/LoadSpinner';
import { FormikValues } from 'formik';
import { Authority, Seller } from 'utils/addresses';
const Marketplace = require('./abis/Marketplace.json');

interface Permit {
  id: number;
  owner: string;
  propertyAddress: string;
  document: string;
  licenceNumber: string;
  status: applicationStatus;
}

interface Props {}

interface State {
  account: string;
  loading: boolean;
  permitCount: number;
  permits: Permit[];
  marketplace: any;
  marketplaceAddress: string;
}

// ignoring types - TODO fix this later
declare let window: any;

// https://stackoverflow.com/questions/2010892/storing-objects-in-html5-localstorage
// allow for storing objects in local storage
// Storage.prototype.setObject = function (key: string, value: {}) {
//   this.setItem(key, JSON.stringify(value));
// };

// // get object from local storage
// Storage.prototype.getObject = function (key: string) {
//   let value = this.getItem(key);
//   return value && JSON.parse(value);
// };

export default class App extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      account: '',
      loading: true,
      permitCount: 0,
      permits: [],
      marketplace: {},
      marketplaceAddress: '',
    };
  }

  /**
   * Loads web3 to allow for ethereum in browser - adds into state
   */
  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert('Non-Ethereum browser detected. Please setup Metamask');
    }
  }

  async componentDidMount() {
    await this.loadWeb3();
    await this.loadBlockchainData();
  }

  /**
   * loads blockchain marketplace from Ganache and puts it into state
   */
  async loadBlockchainData() {
    this.getAccount();
    // load the marketplace into state
    const networkId = await window.web3.eth.net.getId();
    const networkData = Marketplace.networks[networkId];
    // check user is on the correct eth network otherwise alert
    if (networkData) {
      const abi = Marketplace.abi;
      // https://web3js.readthedocs.io/en/v1.3.4/web3-eth-contract.html
      const marketplace = new window.web3.eth.Contract(
        abi,
        networkData.address
      );
      // get permit count to perform loop - no .length in Solidity
      const permitCount = await marketplace.methods.permitCount().call();
      // loop through array of permits in marketplace, add into state
      this.getPermits(permitCount, marketplace);
      this.setState({
        marketplace,
        permitCount: permitCount.toString(),
        marketplaceAddress: networkData.address,
        loading: false,
      });
    } else {
      window.alert('Marketplace is not deployed to detected network');
    }
  }

  async getAccount() {
    // set current user account into state
    const accounts = await window.web3.eth.getAccounts();
    this.setState({ account: accounts[0] });

    // https://ethereum.stackexchange.com/questions/42768/how-can-i-detect-change-in-account-in-metamask
    // calls twice?
    window.ethereum.on('accountsChanged', (accounts: any) => {
      this.setState({ account: accounts[0] });
    });
  }

  async getPermits(permitCount: number, marketplace: any) {
    this.setState({ permits: [] });
    for (let i = 1; i <= permitCount; i++) {
      const permit = await marketplace.methods.permits(i).call();
      this.setState({ permits: [...this.state.permits, permit] });
    }
  }

  /**
   * Creates a sell permit and puts it in the marketplace
   * @param data User input from the form - Formik validated
   */
  createPermit(data: FormikValues) {
    this.setState({ loading: true });
    this.state.marketplace.methods
      .createPermit(data.propertyAddress, data.document, data.licenceNumber, 0)
      .send({ from: this.state.account })
      .on('receipt', (receipt: any) => {
        this.loadBlockchainData();
        this.setState({ loading: false });
      })
      .on('error', async (error: any) => {
        console.log(error);
        this.setState({ loading: false });
      });
  }

  /**
   * Updates permits status when called
   * @param id permit ID
   * @param status status to update permit to
   */
  updatePermit(id: number, status: applicationStatus) {
    this.setState({ loading: true });
    this.state.marketplace.methods
      .updatePermit(id, status)
      .send({ from: this.state.account })
      .on('receipt', (receipt: any) => {
        this.loadBlockchainData();
        this.setState({ loading: false });
      })
      .on('error', async (error: any) => {
        console.log(error);
        this.setState({ loading: false });
      });
  }

  /**
   * Function that directs the call back to the appropriate function based on the request type
   * @param requestType Type of request - from Request Type enum
   * @param data any data being passed from the components
   */
  runCallBack(requestType: requestType, data?: any) {
    // TODO - kinda bleh implementation - swap to generics?
    switch (requestType) {
      case 0:
        this.createPermit(data);
        break;
      case 1:
        this.updatePermit(data.id, data.status);
        break;
      default:
        break;
    }
  }

  // TODO this bugs out on default case when switching accounts
  getAccountType() {
    switch (this.state.account) {
      case Seller:
        return 'Seller';

      case Authority:
        return 'Authority';

      default:
        return 'Not logged in';
    }
  }

  render() {
    return (
      <div>
        <NavigationBar account={this.getAccountType()} />
        <Container>
          {this.state.loading ? (
            <LoadSpinner />
          ) : (
            <Main
              cb={(requestType: requestType, data: any) =>
                this.runCallBack(requestType, data)
              }
              userAddress={this.state.account}
              marketplaceAddress={this.state.marketplaceAddress}
              permits={this.state.permits}
            />
          )}
        </Container>
        <Footer />
      </div>
    );
  }
}
