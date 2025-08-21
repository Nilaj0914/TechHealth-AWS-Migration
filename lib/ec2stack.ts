import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

interface Ec2StackProps extends cdk.StackProps{
    vpc:ec2.Vpc;
}

export class Ec2stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: Ec2StackProps){
    super(scope, id, props);

    //obtain keypair from AWS account for SSH access
    const keypairname = 'bastionVM';
    //Obtain current IP address for SSH access
    const myIP = this.node.tryGetContext('myIP');

    //Throw error if IP not provided during cdk deploy
    if (!myIP){
      throw new Error ("Please provide your IP address into the context using: cdk deploy --context myIP=$(curl ifconfig.me");
    }

    //EC2 User Data
    const userdata = ec2.UserData.forLinux();
      userdata.addCommands(
        'echo "hello world"')

    //EC2 Security Group
     const securitygroup = new ec2.SecurityGroup(this, "WebServerSG",{
        vpc: props.vpc,
    })
    securitygroup.addIngressRule(
      ec2.Peer.ipv4(`${myIP}/32`),
      ec2.Port.tcp(22),
      "Allow SSH access from my IP")
    /* securitygroup.addEgressRule(
       ec2.Peer.securityGroup(DatabaseSG))
       */

    //EC2 instances for each public subnet in the VPC
    let instancecount = 2;
    for (let i=0; i<instancecount; i++){
      const instance = new ec2.Instance(this, "Webserver"+[i+1],{
        vpc: props.vpc,
        vpcSubnets:{
          subnetType: ec2.SubnetType.PUBLIC,
          availabilityZones: [props.vpc.availabilityZones[i]]
        },
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
        machineImage: ec2.MachineImage.genericLinux({
          'ap-south-1': 'ami-0861f4e788f5069dd'}),
          
        userData: userdata,
        securityGroup: securitygroup,
        keyName: keypairname
        })
       
    
      };
      }
      

  }



