import React, { Component, useState } from "react";
import _ from "lodash";
import {
    Alert,
    Button,
    Col,
    Form,
    Row,
    Tab,
    Table,
    Tabs,
} from "react-bootstrap";
import { ControlledEditor, monaco } from "@monaco-editor/react";
import { Config } from "./Config";
import MotifVisualizer from "./MotifVisualizer";

import "./pane-styling.css";

import SplitPane, { Pane } from "react-split-pane";

export class MotifStudio extends Component<
    {},
    {
        motifText?: string;
        motifJSON: any;
        rightPaneTab: string;
        loading: boolean;
        results?: any;
        executionDuration: number;
    }
> {
    constructor(props: {}) {
        super(props);
        this.state = {
            motifText: "",
            motifJSON: undefined,
            rightPaneTab: "run",
            results: undefined,
            executionDuration: 0,
            loading: false,
        };
        this.handleInputChanged = this.handleInputChanged.bind(this);
        this.handlePressExecute = this.handlePressExecute.bind(this);
        this.updateMotifJSON = _.throttle(
            this.updateMotifJSON.bind(this),
            Config.api.throttleMs
        );
    }

    updateMotifJSON() {
        //  @ts-ignore
        fetch(Config.api.baseURL + "/parse", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ motif: this.state.motifText }),
        })
            .then((res) => res.json())
            .then((motifParseResponse) => {
                console.log(motifParseResponse);
                this.setState({ motifJSON: motifParseResponse.motif });
            });
    }

    handleInputChanged(ev: { target: { value: string } }, value?: string) {
        this.setState({ motifText: value });
        if (value) {
            window.localStorage.setItem("motifText", value);
            this.updateMotifJSON();
        }
    }

    componentDidMount() {
        monaco
            .init()
            .then((monaco) => {
                // Register a new language
                monaco.languages.register({ id: "motiflang" });

                // Register a tokens provider for the language
                monaco.languages.setMonarchTokensProvider("motiflang", {
                    tokenizer: {
                        root: [
                            [/#.*$/, "comment"],
                            [/\b[\>\<\=\!]{1,2}\b/, "op"],
                            [/[\-\~\!][\>\|]/, "edge"],
                            [/\w+/, "entity"],
                            [/\w+\(.*/, "macro"],
                        ],
                    },
                });

                // Define a new theme that contains only rules that match this language
                monaco.editor.defineTheme("motiftheme", {
                    base: "vs",
                    inherit: false,
                    rules: [
                        {
                            token: "op",
                            foreground: "ff0000",
                            fontStyle: "bold",
                        },
                        {
                            token: "edge",
                            foreground: "0066dd",
                            fontStyle: "bold",
                        },
                        { token: "entity", foreground: "008800" },
                        { token: "macro", foreground: "888800" },
                    ],
                });
            })
            .catch((error) =>
                console.error(
                    "An error occurred during initialization of Monaco: ",
                    error
                )
            );
    }

    handlePressExecute() {
        // @ts-ignore
        let start = new Date() * 1;
        this.setState({ loading: true });
        fetch(Config.api.baseURL + "/execute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                motif: this.state.motifText,
                hostID: "kakaria-bivort",
            }),
        })
            .then((res) => res.json())
            .then((motifParseResponse) => {
                // TODO: Maybe rewrite motif in state, as returned?
                // Results is a dict where keys are motif ID and values are a
                // list of host IDs (all of the same length).
                this.setState({
                    motifJSON: motifParseResponse.motif,
                    results: motifParseResponse.results,
                    // @ts-ignore
                    executionDuration: new Date() * 1 - start,
                    loading: false,
                });
            })
            .catch((err) => console.error(err));
    }

    render() {
        let defaultValue =
            this.state.motifText ||
            window.localStorage.getItem("motifText") ||
            "# My Example Motif\n\nNeuron_A -> Neuron_2";

        return (
            <SplitPane split="vertical" minSize={100} defaultSize={"25%"}>
                <Pane>
                    <ControlledEditor
                        height="90vh"
                        language="motiflang"
                        theme="motiftheme"
                        value={defaultValue}
                        onChange={this.handleInputChanged}
                    />
                </Pane>
                <Pane>
                    <Tabs
                        id="controlled-tab-example"
                        activeKey={this.state.rightPaneTab}
                        onSelect={(k) =>
                            k ? this.setState({ rightPaneTab: k }) : null
                        }
                    >
                        <Tab
                            eventKey="view"
                            title="View"
                            style={{ height: "90vh" }}
                        >
                            <MotifVisualizer graph={this.state.motifJSON} />
                        </Tab>
                        <Tab
                            eventKey="run"
                            title="Run"
                            style={{ height: "90vh", padding: "1em" }}
                        >
                            <Row style={{ minHeight: "40vh" }}>
                                <Col>
                                    <Form>
                                        <Form.Group>
                                            <Form.Label>Dataset</Form.Label>
                                            <Form.Control as="select" custom>
                                                <option>
                                                    C. elegans (Cook 2019)
                                                </option>
                                                <option>
                                                    Drosophila Medulla (Takemura
                                                    2013)
                                                </option>
                                                <option>Hemibrain</option>
                                                <option>
                                                    Kakaria-Bivort Ring
                                                    Attractor
                                                </option>
                                                <option>MICrONS v185</option>
                                            </Form.Control>
                                        </Form.Group>
                                        <Form.Group>
                                            <Form.Label>
                                                Executor Arguments
                                            </Form.Label>
                                            <Form.Control as="select" custom>
                                                <option>neuPrint Token</option>
                                            </Form.Control>
                                        </Form.Group>
                                        <Button
                                            variant="primary"
                                            block
                                            onClick={this.handlePressExecute}
                                        >
                                            {this.state.loading
                                                ? "Running..."
                                                : "Run"}
                                        </Button>
                                    </Form>
                                </Col>
                                <Col>
                                    <MotifVisualizer
                                        graph={this.state.motifJSON}
                                    />
                                </Col>
                            </Row>
                            <Row>
                                <Col
                                    style={{
                                        overflow: "scroll",
                                        maxHeight: "45vh",
                                    }}
                                >
                                    {this.state.results === undefined ? (
                                        <Table striped bordered hover>
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Node ID ...</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td>0</td>
                                                    <td>
                                                        Results will appear
                                                        here...
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                    ) : (
                                        <div>
                                            <Alert variant={"primary"}>
                                                {
                                                    Object.keys(
                                                        // @ts-ignore
                                                        Object.values(
                                                            this.state.results
                                                        )[0]
                                                    ).length
                                                }{" "}
                                                results in{" "}
                                                {this.state.executionDuration /
                                                    1000}{" "}
                                                seconds.
                                            </Alert>
                                            <Table striped bordered hover>
                                                <thead>
                                                    <tr>
                                                        <th>#</th>
                                                        {Object.keys(
                                                            this.state.results
                                                        ).map((k) => (
                                                            <th key={k}>{k}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {_.zip(
                                                        ...Object.keys(
                                                            this.state.results
                                                        ).map((k) =>
                                                            Object.values(
                                                                this.state
                                                                    .results[k]
                                                            )
                                                        )
                                                    ).map((row, i) => {
                                                        return (
                                                            <tr key={i}>
                                                                <td>{i}</td>
                                                                {row.map(
                                                                    (m) => (
                                                                        <td
                                                                            // @ts-ignore
                                                                            key={
                                                                                m
                                                                            }
                                                                        >
                                                                            {/*@ts-ignore*/}
                                                                            {m}
                                                                        </td>
                                                                    )
                                                                )}
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </Table>
                                        </div>
                                    )}
                                </Col>
                            </Row>
                        </Tab>
                    </Tabs>
                </Pane>
            </SplitPane>
        );
    }
}
