// import bci from 'bcijs/browser.js'
// import {Plugin} from '../Plugin'

export class Lda2{
    static id = String(Math.floor(Math.random() * 1000000))

    constructor(label, session, params={}) {
        this.label = label
        this.session = session

        // UI Identifier
        this.props = {
            id: String(Math.floor(Math.random() * 1000000)),

        }

        this.ports = {

            learn: {
                input: { type: undefined }, // 2 x m x n matrix, 2 classes, m trials, n features
                output: { type: Object }, 
                onUpdate: (user) => {

                   

                    let classes = Object.keys(user.data)
                    let class1 = classes[0]
                    console.log('class 1:', class1)
                    let class2 = classes[1]
                    console.log('class 2:', class2)

                    let data1 = user.data[class1]
                    let data2 = user.data[class2]

                    //partition user.data
                    let partitions1 = bci.partition(data1, 0.75, 0.25)
                    let partitions2 = bci.partition(data2, 0.75, 0.25)

                    let training1 = partitions1[0]
                    let testing1 = partitions1[1]
                    let training2 = partitions2[0]
                    let testing2 = partitions2[1]

                    console.log(training1, testing1, training2, testing2)

                    let ldaParams = bci.ldaLearn(training1, training2); 

                    console.log(ldaParams)

                    let classify = (feature) => {
                        let prediction = bci.ldaProject(ldaParams, feature);
                        console.log(prediction)
                        return (prediction < 0) ? 0 : 1;
                    }

                    // Classify testing data
                    let predictions1 = testing1.map(classify);
                    let predictions2 = testing2.map(classify);
                    console.log(predictions1, predictions2)

                    // Evaluate the classifer
                    let actual1 = new Array(predictions1.length).fill(0);
                    let actual2 = new Array(predictions2.length).fill(1);
                    console.log(actual1, actual2)

                    let predictions = predictions1.concat(predictions2);
                    let actual = actual1.concat(actual2);
                    console.log(predictions, actual)

                    let confusionMatrix = bci.confusionMatrix(predictions, actual);

                    let bac = bci.balancedAccuracy(confusionMatrix);
                    console.log(bac)
                    console.log('confusion matrix');
                    console.log(bci.toTable(confusionMatrix));
                    console.log('balanced accuracy');
                    console.log(bac);

                    return { data: ldaParams}
                }
            },
        }
    }

    init = () => {}

    deinit = () => {}
}