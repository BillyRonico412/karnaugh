import { useState } from "react";
import { useDispatch } from "react-redux";
import { appActions } from "../utils/appStore";
import { karnaugh, ModeEnum } from "../utils/models";

const AddClause = () => {
    const dispatch = useDispatch();
    const [clause, setClause] = useState("");
    const [mode, setMode] = useState<ModeEnum>(ModeEnum.DEC);
    const onClickValider = () => {
        if (clause !== "") {
            karnaugh.addClause(Number(clause));
            dispatch(appActions.setTable(karnaugh.table));
            dispatch(appActions.setClauses(karnaugh.getStringClause()));
            setClause("");
        }
    };
    return (
        <div className="flex flex-col gap-y-4 items-center">
            <div className="flex gap-x-4 items-center">
                <p className="font-bold">Add clauses</p>
                <div className="flex shadow rounded overflow-hidden font-bold">
                    {/* <button
                        className={
                            "border w-16 text-center py-1 " +
                            (mode === ModeEnum.BIN &&
                                "bg-blue-600 text-white border-blue-600")
                        }
                        onClick={() => {
                            // setMode(ModeEnum.BIN);
                        }}
                    >
                        BIN
                    </button>
                    <button
                        className={
                            "border w-16 text-center py-1 " +
                            (mode === ModeEnum.DEC &&
                                "bg-blue-600 text-white border-blue-600")
                        }
                        onClick={() => {
                            setMode(ModeEnum.DEC);
                        }}
                    >
                        DEC
                    </button> */}
                </div>
            </div>
            <div className="flex gap-x-4">
                <input
                    type="text"
                    className="border shadow px-4 py-1 rounded text-center font-bold"
                    placeholder="12"
                    onInput={(e) => {
                        if (!isNaN(Number(e.currentTarget.value)) && karnaugh) {
                            if (
                                mode === ModeEnum.DEC &&
                                0 <= Number(e.currentTarget.value) &&
                                Number(e.currentTarget.value) <
                                    0b1 << karnaugh.nbVar
                            ) {
                                setClause(e.currentTarget.value);
                            }
                        }
                    }}
                    value={clause}
                />
                <button
                    className="bg-blue-600 text-white py-1 rounded px-4 font-bold"
                    onClick={onClickValider}
                >
                    Valider
                </button>
            </div>
        </div>
    );
};

export default AddClause;
