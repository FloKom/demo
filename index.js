// material-ui
// import { Typography } from '@mui/material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import { useDemoData } from '@mui/x-data-grid-generator';
import { useTheme } from '@mui/material/styles';
import { saveAs } from 'file-saver';
// project imports
import { useGridApiRef } from '@mui/x-data-grid';
import { Download, Upload } from '@mui/icons-material';
import Papa from 'papaparse';
import { Input, ListItem, Typography, Dialog, DialogContent, DialogActions, DialogTitle, DialogContentText, MenuItem } from '@mui/material';
import { Button, TextField, Alert } from '@mui/material';
import MainCard from 'ui-component/cards/MainCard';
import test from './test2.csv';
import { Box } from '@mui/material';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { Grid } from '@mui/material';
import TotalIncomeLightCard from 'ui-component/TotalIncomeLightCard';
import { gridSpacing } from 'store/constant';
import { height } from '@mui/system';
import { handleExport } from 'utils/export';
const Excel = require('exceljs');
// ==============================|| SAMPLE PAGE ||============================== //
const status = [
    {
        value: 'IHS',
        label: 'ESCO'
    },
    {
        value: 'ESCO',
        label: 'ESCO'
    }
];

const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

function SamplePage() {
    function getFullName(params) {
        let row = params.row['Dernier paiement '].trim();
        console.log(row);
        row = row.split(' ');
        let monthEnd = row[5];
        if (row.length == 7) {
            // monthStart = monthStart.split('.');
            console.log('monthEnd', monthEnd);
            monthEnd = monthEnd.split('.');
            // let res1 = months.findIndex((month) => month.includes(monthStart[0]));
            let res2 = months.findIndex((month) => month.includes(monthEnd[0]));
            if (res2 == -1) {
                res2 = ['Février', 'Août', 'Décembre'].find((month) => month.includes(monthEnd[0][0], 0));
                res2 = months.findIndex((month) => month == res2);
            }
            console.log(row);
            console.log(res2);
            let dateEnd = new Date(row[row.length - 1], res2, row[4]);
            let nowDate = new Date();
            let diffYear = 12 * (dateEnd.getFullYear() - nowDate.getFullYear());
            let montDiff = dateEnd.getMonth() - nowDate.getMonth() + diffYear;
            console.log('mondiff', montDiff);
            if (montDiff > 4) {
                return 'vert';
            } else if (montDiff <= 4 && montDiff >= 1) {
                return 'orange';
            } else {
                return 'rouge';
            }
        } else {
            return '';
        }
    }
    function getStatus(params) {
        if (params.row['Expiration  Bail'].split('/').length == 3) {
            let now = new Date();
            let dateExpi = new Date(params.row['Expiration  Bail']);
            if (now.getTime() > dateExpi.getTime()) {
                return 'Expirer';
            } else {
                return 'Non Expirer';
            }
        }
    }
    const columns = [
        { field: 'Codesite', headerName: 'Codesite', width: 130 },
        { field: 'Nomdusite', headerName: 'Nomdusite', width: 130 },
        { field: 'Catégorie de Site', headerName: 'Catégorie de Site', width: 130, editable: true },
        { field: 'Quartier', headerName: 'Quartier', width: 130 },
        { field: 'Expiration  Bail', headerName: 'Expiration  Bail', width: 130 },
        { field: 'Dernier paiement ', headerName: 'Dernier paiement ', width: 250 },
        { field: 'Contact Bailleur ', headerName: 'Contact Bailleur ', width: 130 },
        { field: 'Montant de loyer', headerName: 'Montant de loyer', width: 130 },
        {
            field: 'Statut bail',
            headerName: 'Statut Bail',
            type: 'singleSelect',
            width: 180,
            valueOptions: ['Non Expirer', 'Expirer'],
            valueGetter: getStatus,
            renderCell: (params) => {
                if (params.value == 'Expirer') {
                    return (
                        <Alert severity="error" variant="outlined" color="error" sx={{ fontWeight: 'bold' }}>
                            {params.value}
                        </Alert>
                    );
                }
                if (params.value == 'Non Expirer') {
                    return (
                        <Alert severity="success" variant="outlined" color="success" sx={{ fontWeight: 'bold' }}>
                            {params.value}
                        </Alert>
                    );
                }
            }
        },
        {
            width: 130,
            field: 'Status',
            type: 'singleSelect',
            valueOptions: ['vert', 'orange', 'rouge'],
            valueGetter: getFullName,
            editable: true,
            renderCell: (params) => {
                if (params.value === 'vert') {
                    return (
                        <Alert severity="success" variant="outlined" color="success" sx={{ fontWeight: 'bold' }}>
                            {params.value}
                        </Alert>
                    );
                } else if (params.value == 'rouge') {
                    return (
                        <Alert severity="error" variant="outlined" color="error" sx={{ fontWeight: 'bold' }}>
                            {params.value}
                        </Alert>
                    );
                } else if (params.value == 'orange') {
                    return (
                        <Alert severity="warning" variant="outlined" color="warning" sx={{ fontWeight: 'bold' }}>
                            {params.value}
                        </Alert>
                    );
                }
            }
        },
        {
            field: 'actions',
            headerName: 'Actions',
            type: 'actions',
            width: 80,
            getActions: (params) => [
                <GridActionsCellItem color="secondary" icon={<EditIcon />} label="Update" onClick={() => updateMethod(params)} />
            ]
        }
    ];
    const [open, setOpen] = React.useState(false);
    const [month, setMonth] = useState(6);
    const [id, setId] = useState('');
    const apiRef = useGridApiRef();
    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };
    const [loading, setLoading] = useState(true);
    const [value, setValue] = useState('ESCO');
    const [rowsIHS, setRowsIHS] = useState([]);
    const [rowsESCO, setRowsESCO] = useState([]);
    const theme = useTheme();
    const [rows, setrows] = useState([]);
    const handleImport = ($event) => {
        setLoading(true);
        const files = $event.target.files;
        if (files.length > 0) {
            const file = files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                console.log(event.target.result);
                Papa.parse(event.target.result, {
                    header: true,
                    skipEmptyLines: true,
                    complete: function (results) {
                        // setData(results.data);
                        results.data = results.data.map((res, idx) => {
                            res.id = idx;
                            return res;
                        });
                        console.log(results.data);
                        setrows(results.data);
                        setLoading(false);
                    }
                });
            };
            // reader.readAsArrayBuffer(file);
            console.log(reader.readAsText(file));
            // setrows(data);
        }
    };
    // const handleExport = () => {
    //     const workbook = new Excel.Workbook();
    //     const worksheet = workbook.addWorksheet('Sheet 1');
    //     const columns = apiRef.current.getVisibleColumns().map((column) => {
    //         return {
    //             header: column.field,
    //             key: column.field
    //         };
    //     });
    //     worksheet.columns = [...columns];
    //     worksheet.addRows(rows);
    //     workbook.xlsx.writeBuffer().then(function (buffer) {
    //         saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'export.xlsx');
    //     });
    // };
    const handleChange = () => {
        let row = rows.find((ele) => ele.id == id);
        // console.log('row', row);
        let newRows = [...rows];
        let lastPaiement = row['Dernier paiement '].split(' ');
        let monthEnd = lastPaiement[5];
        if (lastPaiement.length == 7) {
            monthEnd = monthEnd.split('.');
            let res2 = months.findIndex((month) => month.includes(monthEnd[0]));
            if (res2 == -1) {
                res2 = ['Février', 'Août', 'Décembre'].find((month) => month.includes(monthEnd[0][0], 0));
                res2 = months.findIndex((month) => month == res2);
            }
            let dateEnd = new Date(lastPaiement[lastPaiement.length - 1], res2, lastPaiement[4]);
            let mem = new Date(lastPaiement[lastPaiement.length - 1], res2, lastPaiement[4]);
            let startDate = new Date(dateEnd.setDate(dateEnd.getDate() + 1));
            let newDateEnd = new Date(mem.setMonth(mem.getMonth() + parseInt(month)));
            row['Dernier paiement '] =
                startDate.getDate() +
                ' ' +
                months[startDate.getMonth()].substring(0, 3) +
                ' ' +
                startDate.getFullYear() +
                ' ' +
                '-' +
                ' ' +
                newDateEnd.getDate() +
                ' ' +
                months[newDateEnd.getMonth()].substring(0, 3) +
                ' ' +
                newDateEnd.getFullYear();
            console.log(row['Dernier paiement ']);
            newRows = newRows.map((element) => {
                if (element.id == id) {
                    element = row;
                }
                return element;
            });
            apiRef.current.setRows(newRows);
            handleClose();
            setMonth(6);
        }
    };
    const updateMethod = (params) => {
        handleClickOpen();
    };
    const handleClickRow = (e) => {
        setId(e.id);
    };
    useEffect(() => {
        console.log('excel', Excel);
        fetch(test)
            .then((r) => r.text())
            .then((text) => {
                Papa.parse(text, {
                    header: true,
                    skipEmptyLines: true,
                    complete: function (results) {
                        // setData(results.data);
                        results.data = results.data.map((res, idx) => {
                            // console.log(res['Dernier paiement ']);
                            res.id = idx;
                            return res;
                        });
                        console.log(results.data);
                        setrows(results.data);
                        setRowsESCO(results.data.filter((item) => item['Catégorie de Site'] == 'Esco'));
                        setRowsIHS(results.data.filter((item) => item['Catégorie de Site'] == 'Towerco'));
                        setLoading(false);
                    }
                });
            });
    }, []);
    if (loading) {
        return <></>;
    } else {
        return (
            <>
                <MainCard
                    title="Gestion de baux"
                    secondary={
                        <Button variant="contained" disableElevation startIcon={<Download />} onClick={() => handleExport(apiRef, rows)}>
                            Export
                        </Button>
                    }
                >
                    {/* <Box sx={{ alignItems: 'flex-end', display: 'flex', marginBottom: -3, marginTop: -2 }}>
                        <Box sx={{ flexGrow: 1 }} />
                        <Button
                            variant="contained"
                            component="label"
                            sx={{ marginRight: 5, marginBottom: 5 }}
                            disableElevation
                            startIcon={<Upload />}
                        >
                            Import
                            <input type="file" hidden onChange={handleImport} />
                        </Button>
                        <Button variant="contained" sx={{ marginBottom: 5 }} disableElevation startIcon={<Download />}>
                            Export
                        </Button>
                    </Box> */}
                    {/* <Typography variant="body2">
                        Lorem ipsum dolor sit amen, consenter nipissing eli, sed do elusion tempos incident ut laborers et doolie magna alissa. Ut enif
                        ad minim venice, quin nostrum exercitation illampu laborings nisi ut liquid ex ea commons construal. Duos aube grue dolor in
                        reprehended in voltage veil esse colum doolie eu fujian bulla parian. Exceptive sin ocean cuspidate non president, sunk in culpa
                        qui officiate descent molls anim id est labours.
                    // </Typography> */}
                    <Grid container spacing={gridSpacing} sx={{ marginBottom: 2 }}>
                        <Grid item lg={3} md={6} sm={6} xs={12}>
                            <TextField id="standard-select-currency" select value={value} onChange={(e) => setValue(e.target.value)}>
                                {status.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item lg={3} md={6} sm={6} xs={12}>
                            <TotalIncomeLightCard nombre={302} titre={'Baux dont le contrat est exiperer'} />
                        </Grid>
                        <Grid item lg={3} md={6} sm={6} xs={12}>
                            <TotalIncomeLightCard nombre={2000} titre={'Baux à payer '} />
                        </Grid>
                        <Grid item lg={12} md={12} sm={12} xs={12} sx={{ height: 600 }}>
                            <DataGrid
                                sx={{
                                    '& .MuiDataGrid-virtualScroller::-webkit-scrollbar': {
                                        width: '0.4em',
                                        height: '0.4em'
                                    },
                                    '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-track': {
                                        background: '#f1f1f1'
                                    },
                                    '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb': {
                                        backgroundColor: '#888'
                                    },
                                    '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb:hover': {
                                        background: '#555'
                                    }
                                }}
                                rows={value == 'IHS' ? rowsIHS : rowsESCO}
                                onCellClick={handleClickRow}
                                columns={columns}
                                apiRef={apiRef}
                            />
                        </Grid>
                    </Grid>
                </MainCard>
                <Dialog open={open} onClose={handleClose}>
                    <DialogTitle>Mise a jour de l'echeance</DialogTitle>
                    <DialogContent>
                        <DialogContentText>Duree de paiement</DialogContentText>
                        <TextField
                            margin="dense"
                            id="month"
                            label="duree en mois"
                            // fullWidth
                            type="number"
                            value={month}
                            onChange={(e) => {
                                setMonth(e.target.value);
                            }}
                            variant="outlined"
                            sx={{
                                '& label.Mui-focused': {
                                    color: theme.palette.secondary.main
                                },
                                '& .MuiInput-underline:after': {
                                    borderBottomColor: theme.palette.secondary.main
                                },
                                '& .MuiOutlinedInput-root': {
                                    '&:hover fieldset': {
                                        borderColor: theme.palette.secondary.main
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: theme.palette.secondary.main
                                    }
                                }
                            }}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose}>Cancel</Button>
                        <Button onClick={handleChange}>Subscribe</Button>
                    </DialogActions>
                </Dialog>
            </>
        );
    }
}

export default SamplePage;
