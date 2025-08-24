import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as targets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';


interface Ec2StackProps extends cdk.StackProps{
    vpc:ec2.Vpc;
}

export class Ec2stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: Ec2StackProps){
    super(scope, id, props);

    //import keypair from AWS account for SSH access
    const KeyPair = ec2.KeyPair.fromKeyPairName(this, 'KeyPair', 'bastionVM');

    //Obtain current IP address for SSH access
    const myIP = this.node.tryGetContext('myIP');

    //Throw error if IP not provided during cdk deploy
    if (!myIP){
      throw new Error ("Please provide your IP address into the context using: cdk deploy --context myIP=$(curl ifconfig.me");
    }

    

    // Application Load Balancer Security group
    const AlbSG = new ec2.SecurityGroup(this, "AlbSG",{
      vpc: props.vpc,
      allowAllOutbound: true,
      description: "security group for ALB"
    })
    AlbSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      "Allow HTTP access globally"
    )
    // Create Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, "WebServerALB",{
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: AlbSG
    })

    // Create Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, "WebServerTG",{
      vpc: props.vpc,
      port: 80,
      healthCheck:{
        path:"/",
        interval: cdk.Duration.minutes(2),
        timeout: cdk.Duration.minutes(1)
      }
    });

    // Create HTTP Listener
    const Listener = alb.addListener("HTTPListener",{
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup]
    });

  
    //EC2 Security Group
     const securitygroup = new ec2.SecurityGroup(this, "WebServerSG",{
        vpc: props.vpc,
    })
    securitygroup.addIngressRule(
      ec2.Peer.ipv4(`${myIP}/32`),
      ec2.Port.tcp(22),
      "Allow SSH access from my IP")
    /*securitygroup.addIngressRule(
      ec2.Peer.ipv4(`${myIP}/32`),
      ec2.Port.tcp(80),
      "Allow HTTP access from my IP")*/

    securitygroup.connections.allowFrom(
      AlbSG,
      ec2.Port.tcp(80),
      "Allow HTTP access from ALB to EC2 instances"
    )
    /* securitygroup.addEgressRule(
       ec2.Peer.securityGroup(DatabaseSG))
       */

    //EC2 instances for each public subnet in the VPC
    let instancecount = 2;
    for (let i=0; i<instancecount; i++){
      
  const instanceUserData = ec2.UserData.forLinux();

  // Instance User Data to install and start APACHE WEB SERVER and display the instance name on the webpage
  const serverId = i + 1;
  const welcomeMessage = `<h1>Welcome to TechHealth! Served by: Webserver-${serverId}</h1>`;
  instanceUserData.addCommands(
    'sudo yum update -y',
    'sudo yum install -y httpd',
    'sudo systemctl start httpd',
    'sudo systemctl enable httpd',
    `echo "${welcomeMessage}" > /var/www/html/index.html`
  );
      const instance = new ec2.Instance(this, "Webserver"+[i+1],{
        vpc: props.vpc,
        vpcSubnets:{
          subnetType: ec2.SubnetType.PUBLIC,
          availabilityZones: [props.vpc.availabilityZones[i]]
        },
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
        machineImage: ec2.MachineImage.genericLinux({
          'ap-south-1': 'ami-0861f4e788f5069dd'}),
          
        userData: instanceUserData,
        securityGroup: securitygroup,
        keyPair: KeyPair
          
        });

        // Add instance to target group (the loop will allow multiple instances to be added)
        targetGroup.addTarget(new targets.InstanceIdTarget(instance.instanceId));
      };

      // Output the DNS name of the ALB
      new cdk.CfnOutput(this, "AlbDNS",{
        value: alb.loadBalancerDnsName,
        description: "DNS name of the Application Load Balancer",
        exportName: "AlbDNS"
      })
      }
      

  }



