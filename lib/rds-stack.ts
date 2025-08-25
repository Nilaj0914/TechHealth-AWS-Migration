import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';

interface RdsStackProps extends cdk.StackProps{
    vpc:ec2.Vpc;
    WebServerSG:ec2.SecurityGroup;
}
export class RDSStack extends cdk.Stack {
    public readonly DatabaseSG: ec2.SecurityGroup;
  constructor(scope: Construct, id: string, props: RdsStackProps){
    super(scope, id, props);

    //Database Security Group
    const DatabaseSG = new ec2.SecurityGroup(this, "DatabaseSG",{
        vpc: props.vpc,
        description: "security group for secure connection from EC2 instance to RDS"
    })
    DatabaseSG.addIngressRule(
        props.WebServerSG,
        ec2.Port.tcp(3306),
        "Allow EC2 instances to access RDS on port 3306 (MySQL)"
    )

    // RDS Instance (db.t3.micro, MySQL, 20GB storage, in isolated private subnet)

    const rdsInstance = new rds.DatabaseInstance(this, "HealthDataDB",{
        engine: rds.DatabaseInstanceEngine.mysql({
            version: rds.MysqlEngineVersion.VER_8_0_42}),
    vpc: props.vpc,
    vpcSubnets:{
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,},
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
        allocatedStorage: 20,
        maxAllocatedStorage: 30,
        multiAz: true,

        // Randoomly generated password stored securely in AWS Secrets Manager under the username "DBAdmin"
        credentials: rds.Credentials.fromGeneratedSecret('DBadmin'),

        // Database Security Group attachment
        securityGroups: [DatabaseSG],
        databaseName: 'HealthDataDB',
        deletionProtection: false,
        removalPolicy: cdk.RemovalPolicy.DESTROY
    }
)
// Output the RDS endpoint to verify connection from webservers
new cdk.CfnOutput(this, 'RDS Endpoint',{
    value: rdsInstance.dbInstanceEndpointAddress,
    description: "RDS instance endpont for EC2 connection",
    exportName: "RDSEndpoint"
})

// Output the RDS secrets ARN name to obtain credentials from AWS Secrets Manager
new cdk.CfnOutput(this, "RDSSecretARN",{
    value: rdsInstance.secret?.secretArn || "Not Available",
    description: "ARN of the RDS Secret in AWS Secrets Manager"

})
    }
}
        