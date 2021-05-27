import React, { useRef, useState } from "react";
import "./App.css";

import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";

import { MotifStudio } from "./MotifStudio";
import { toast, ToastContainer } from "react-toastify";
import {
    Button,
    Dropdown,
    FormControl,
    InputGroup,
    ListGroup,
    Modal,
    Nav,
    Navbar,
} from "react-bootstrap";
import { LocalStorageMotifStore } from "./store";

function App() {
    let [view, setView] = useState("Build");
    let studio = useRef(null);
    let [saveModalVisible, setSaveModalVisible] = useState(false);
    let [savingMotifName, setSavingMotifName] = useState("");

    let db = new LocalStorageMotifStore();

    // @ts-ignore
    let motifText = studio?.current?.state?.motifText;

    let savedMotifs = Object.values(db.list()).sort((left, right) =>
        new Date(left.savedDate)
            .toISOString()
            .localeCompare(new Date(right.savedDate).toISOString())
    );

    let handleSave = () => {
        db.save(savingMotifName, {
            name: savingMotifName,
            motifText,
            savedDate: new Date(),
        });
        setSaveModalVisible(false);
        toast.success(`Saved '${savingMotifName}'.`);
    };

    let savedMotifsListGroup = (
        <ListGroup>
            {savedMotifs.map((motif) => (
                <ListGroup.Item
                    key={motif.name}
                    onClick={(ev) => setSavingMotifName(motif.name)}
                >
                    {motif.name}{" "}
                    <div
                        className="float-right"
                        style={{ display: "inline-block" }}
                    >
                        {motif.savedDate.toLocaleString()}
                    </div>
                </ListGroup.Item>
            ))}
        </ListGroup>
    );

    let saveModal = (
        <>
            <Modal
                show={saveModalVisible}
                onHide={() => setSaveModalVisible(false)}
            >
                <Modal.Header closeButton>
                    <Modal.Title>Save this motif</Modal.Title>
                </Modal.Header>

                <Modal.Body>{savedMotifsListGroup}</Modal.Body>

                <Modal.Footer>
                    <InputGroup className="mb-3">
                        <FormControl
                            placeholder="Filename"
                            aria-label="Filename"
                            onChange={(ev) =>
                                setSavingMotifName(ev.target.value)
                            }
                            value={savingMotifName}
                        />
                        <InputGroup.Append>
                            <Button onClick={handleSave} variant="primary">
                                Save
                            </Button>
                        </InputGroup.Append>
                    </InputGroup>
                </Modal.Footer>
            </Modal>
        </>
    );
    return (
        <>
            {saveModal}
            <Navbar bg="primary" variant="dark">
                <Nav className="mr-auto ">
                    <div className="d-flex">
                        <Dropdown>
                            <Dropdown.Toggle
                                as={Nav.Link}
                                active
                                id="dropdown-basic"
                            >
                                File
                            </Dropdown.Toggle>

                            <Dropdown.Menu>
                                <Dropdown.Item>Open</Dropdown.Item>
                                <Dropdown.Item
                                    onClick={() => setSaveModalVisible(true)}
                                >
                                    Save
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item>Share</Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                        <Nav.Link active onClick={() => setView("Build")}>
                            Build
                        </Nav.Link>
                        <Nav.Link active onClick={() => setView("Run")}>
                            Run
                        </Nav.Link>
                    </div>
                </Nav>
                <Navbar.Brand href="#home">Motif Studio</Navbar.Brand>
            </Navbar>
            <MotifStudio requestedView={view} ref={studio} />
            <ToastContainer />
        </>
    );
}

export default App;
