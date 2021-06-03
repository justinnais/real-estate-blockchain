import { FormikValues } from 'formik';
import React, { Component } from 'react';
import { Button, ListGroup, ListGroupItem, Table } from 'react-bootstrap';
import FormCard from '../components/FormCard';
import PermitForm from '../components/forms/PermitForm';
import { applicationStatus, requestType } from '../utils/enums';
// import applicationStatus from '../App';

interface Props {
  marketplaceAddress: string;
  userAddress: string;
  permits: any[];
  cb: (requestType: requestType, data: any) => void;
}

interface State {
  formValues: FormikValues;
}

export default class Main extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      formValues: {},
    };
  }

  getStatus(index: number): string {
    return applicationStatus[index];
  }

  formSubmit(data: FormikValues) {
    console.log('formValues in Main', data);
    this.props.cb(requestType.create, data);
  }

  approvePermit(id: number) {
    const data: any = {
      id: id,
      status: applicationStatus.approved,
    };
    this.props.cb(requestType.update, data);
  }

  render() {
    return (
      <div>
        <ListGroup>
          <ListGroupItem>
            Marketplace address: {this.props.marketplaceAddress}
          </ListGroupItem>
          <ListGroupItem>User Address: {this.props.userAddress}</ListGroupItem>
          <ListGroupItem>
            Permit Count: {this.props.permits.length}
          </ListGroupItem>
        </ListGroup>
        <Table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Owner</th>
              <th>Property Address</th>
              <th>Document</th>
              <th>Licence Number</th>
              <th>Status</th>
            </tr>
            {this.props.permits.length > 0
              ? this.props.permits.map((permit, key) => {
                  let status = typeof applicationStatus;
                  status = permit.status;
                  return (
                    <tr key={key}>
                      <td>{permit.id.toString()}</td>
                      <td>{permit.owner}</td>
                      <td>{permit.propertyAddress}</td>
                      <td>{permit.document}</td>
                      <td>{permit.licenceNumber}</td>
                      <td>{this.getStatus(permit.status) + permit.status}</td>
                      <td>
                        <Button onClick={() => this.approvePermit(parseInt(permit.id))}>
                          Approve
                        </Button>
                      </td>
                    </tr>
                  );
                })
              : ''}
          </thead>
        </Table>
        <FormCard
          title={'Permit Application'}
          form={
            <PermitForm cb={(data: FormikValues) => this.formSubmit(data)} />
          }
        />
      </div>
    );
  }
}
